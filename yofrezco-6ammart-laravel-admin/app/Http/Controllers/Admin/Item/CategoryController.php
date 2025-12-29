<?php

namespace App\Http\Controllers\Admin\Item;

use App\CentralLogics\Helpers;
use App\Contracts\Repositories\CategoryRepositoryInterface;
use App\Contracts\Repositories\TranslationRepositoryInterface;
use App\Enums\ExportFileNames\Admin\Category;
use App\Enums\ViewPaths\Admin\Category as CategoryViewPath;
use App\Exports\CategoryExport;
use App\Http\Controllers\BaseController;
use App\Http\Requests\Admin\CategoryAddRequest;
use App\Http\Requests\Admin\CategoryBulkExportRequest;
use App\Http\Requests\Admin\CategoryBulkImportRequest;
use App\Http\Requests\Admin\CategoryUpdateRequest;
use App\Services\BulkImportTranslationService;
use App\Services\CategoryService;
use App\Traits\ImportExportTrait;
use Illuminate\Support\Facades\Log;
use Brian2694\Toastr\Facades\Toastr;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;
use Maatwebsite\Excel\Facades\Excel;
use OpenSpout\Common\Exception\InvalidArgumentException;
use OpenSpout\Common\Exception\IOException;
use OpenSpout\Common\Exception\UnsupportedTypeException;
use OpenSpout\Writer\Exception\WriterNotOpenedException;
use Rap2hpoutre\FastExcel\FastExcel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CategoryController extends BaseController
{
    use ImportExportTrait;

    public function __construct(
        protected CategoryRepositoryInterface    $categoryRepo,
        protected CategoryService                $categoryService,
        protected TranslationRepositoryInterface $translationRepo
    )
    {
    }

    public function index(?Request $request): View|Collection|LengthAwarePaginator|null
    {
        return $this->getCategoryView($request);
    }

    private function getCategoryView(Request $request): View
    {
        $categories = $this->categoryRepo->getListWhere(
            searchValue: $request['search'],
            filters: ['position' => $request['position'] ?? 0],
            relations: ['module'],
            dataLimit: config('default_pagination')
        );

        $mainCategories = $this->categoryRepo->getMainList(
            filters: ['position' => 0],
            relations: ['module'],
        );

        $language = getWebConfig('language');
        $taxData = Helpers::getTaxSystemType();
        $categoryWiseTax = $taxData['categoryWiseTax'];
        $taxVats = $taxData['taxVats'];

        return view($this->categoryService->getViewByPosition($request['position'] ?? 0), compact('categories', 'language', 'mainCategories', 'categoryWiseTax', 'taxVats'));
    }

    public function add(CategoryAddRequest $request): RedirectResponse
    {
        $parentCategory = $this->categoryRepo->getFirstWhere(params: ['id' => $request['parent_id']]);
        $category = $this->categoryRepo->add(
            data: $this->categoryService->getAddData(
                request: $request,
                parentCategory: $parentCategory
            )
        );
        $this->translationRepo->addByModel(request: $request, model: $category, modelPath: 'App\Models\Category', attribute: 'name');

        if (addon_published_status('TaxModule')) {
            $SystemTaxVat = \Modules\TaxModule\Entities\SystemTaxSetup::where('is_active', 1)->where('is_default', 1)->first();
            if ($SystemTaxVat?->tax_type == 'category_wise') {

                foreach ($request['tax_ids'] ?? [] as $tax_ids) {
                    \Modules\TaxModule\Entities\Taxable::create(
                        [
                            'taxable_type' => 'App\Models\Category',
                            'taxable_id' => $category->id,
                            'system_tax_setup_id' => $SystemTaxVat->id
                            , 'tax_id' => $tax_ids
                        ],
                    );
                }

            }
        }

        Toastr::success($request['position'] == 0 ? translate('messages.category_added_successfully') : translate('messages.Sub_category_added_successfully'));
        return back();
    }

    public function getUpdateView(string|int $id): JsonResponse
    {
        $category = $this->categoryRepo->getFirstWithoutGlobalScopeWhere(params: ['id' => $id]);
        $language = getWebConfig('language');

        $taxData = Helpers::getTaxSystemType();
        $categoryWiseTax = $taxData['categoryWiseTax'];
        $taxVats = $taxData['taxVats'];
        $taxVatIds = $categoryWiseTax ? $category->taxVats()->pluck('tax_id')->toArray() : [];
        $mainCategories = $this->categoryRepo->getMainList(
            filters: ['position' => 0],
            relations: ['module'],
        );
        return response()->json([
            'view' => view('admin-views.category._edit', compact('mainCategories', 'category', 'taxVats', 'categoryWiseTax', 'language', 'taxVatIds'))->render(),
        ]);
    }

    public function updateStatus(Request $request): RedirectResponse
    {
        $this->categoryRepo->update(id: $request['id'], data: ['status' => $request['status']]);
        Toastr::success(translate('messages.category_status_updated'));
        return back();
    }

    public function updateFeatured(Request $request): RedirectResponse
    {
        $this->categoryRepo->update(id: $request['id'], data: ['featured' => $request['featured']]);
        Toastr::success(translate('messages.category_featured_updated'));
        return back();
    }

    public function update(CategoryUpdateRequest $request, string|int $id): RedirectResponse
    {
        $mainCategory = $this->categoryRepo->getFirstWhere(params: ['id' => $id]);
        $category = $this->categoryRepo->update(id: $id, data: $this->categoryService->getUpdateData(request: $request, object: $mainCategory));
        $this->translationRepo->updateByModel(request: $request, model: $category, modelPath: 'App\Models\Category', attribute: 'name');


        if (addon_published_status('TaxModule') && $category['position'] == 0) {
            $taxVatIds = $category->taxVats()->pluck('tax_id')->toArray() ?? [];
            $newTaxVatIds = array_map('intval', $request['tax_ids'] ?? []);
            sort($newTaxVatIds);
            sort($taxVatIds);
            if ($newTaxVatIds != $taxVatIds) {
                $category->taxVats()->delete();
                $SystemTaxVat = \Modules\TaxModule\Entities\SystemTaxSetup::where('is_active', 1)->where('is_default', 1)->first();
                if ($SystemTaxVat?->tax_type == 'category_wise') {
                    foreach ($request['tax_ids'] ?? [] as $tax_ids) {
                        \Modules\TaxModule\Entities\Taxable::create(
                            [
                                'taxable_type' => 'App\Models\Category',
                                'taxable_id' => $category->id,
                                'system_tax_setup_id' => $SystemTaxVat->id
                                , 'tax_id' => $tax_ids
                            ],
                        );
                    }

                }
            }
        }


        Toastr::success($category['position'] == 0 ? translate('messages.category_updated_successfully') : translate('messages.Sub_category_updated_successfully'));
        return redirect()->route('admin.category.add', ['position' => $mainCategory->position]);
    }

    public function delete(Request $request): RedirectResponse
    {

        if ($this->categoryRepo->delete(id: $request['id'])) {
            Toastr::success('Category removed!');
        } else {
            Toastr::warning(translate('messages.remove_sub_categories_first'));
        }
        return back();
    }

    public function getNameList(Request $request): JsonResponse
    {
        $data = $this->categoryRepo->getNameList(request: $request, dataLimit: 8);
        $data[] = (object)['id' => 'all', 'text' => translate('messages.all')];
        return response()->json($data);
    }

    public function updatePriority(Request $request): RedirectResponse
    {
        $this->categoryRepo->update(id: $request['category'], data: ['priority' => $request['priority']]);
        Toastr::success(translate('messages.category_priority_updated successfully'));
        return back();
    }

    public function getBulkImportView(): View
    {
        return view(CategoryViewPath::BULK_IMPORT['view']);
    }

    public function importBulkData(CategoryBulkImportRequest $request): RedirectResponse
    {
        $result = $this->categoryService->getImportDataWithTranslations(request: $request);

        if (array_key_exists('flag', $result) && $result['flag'] == 'wrong_format') {
            Toastr::error(translate('messages.you_have_uploaded_a_wrong_format_file'));
            return back();
        }

        if (array_key_exists('flag', $result) && $result['flag'] == 'required_fields') {
            Toastr::error(translate('messages.please_fill_all_required_fields'));
            return back();
        }

        $data = $result['data'];
        $translationFields = $result['translations'];
        $translationService = new BulkImportTranslationService('es', 'en');

        try {
            DB::beginTransaction();

            // Insert categories and get IDs
            $insertedIds = $this->categoryRepo->addByChunk(data: $data);

            // Process translations with auto-translation (Spanish → English)
            $allTranslations = $translationService->processTranslationsForRecords(
                $insertedIds,
                $translationFields,
                'App\Models\Category'
            );

            // Bulk insert translations
            if (!empty($allTranslations)) {
                $this->translationRepo->addBulk($allTranslations);
            }

            DB::commit();

            // Report any translation failures
            $failureCount = $translationService->getFailureCount();
            if ($failureCount > 0) {
                Toastr::warning(translate('messages.some_translations_failed') . ': ' . $failureCount);
            }

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Category bulk import failed', ['error' => $e->getMessage()]);
            Toastr::error(translate('messages.failed_to_import_data'));
            return back();
        }

        Toastr::success(translate('messages.category_imported_successfully', ['count' => count($data)]));
        return back();
    }

    public function updateBulkData(CategoryBulkImportRequest $request): RedirectResponse
    {
        $result = $this->categoryService->getImportDataWithTranslations(request: $request, toAdd: false);

        if (array_key_exists('flag', $result) && $result['flag'] == 'wrong_format') {
            Toastr::error(translate('messages.you_have_uploaded_a_wrong_format_file'));
            return back();
        }

        if (array_key_exists('flag', $result) && $result['flag'] == 'required_fields') {
            Toastr::error(translate('messages.please_fill_all_required_fields'));
            return back();
        }

        $data = $result['data'];
        $translationFields = $result['translations'];
        $translationService = new BulkImportTranslationService('es', 'en');

        try {
            DB::beginTransaction();

            // Update categories and get affected IDs
            $affectedIds = $this->categoryRepo->updateByChunk(data: $data);

            // Delete existing translations for these categories
            DB::table('translations')
                ->where('translationable_type', 'App\Models\Category')
                ->whereIn('translationable_id', $affectedIds)
                ->delete();

            // Process new translations with auto-translation (Spanish → English)
            $allTranslations = $translationService->processTranslationsForRecords(
                $affectedIds,
                $translationFields,
                'App\Models\Category'
            );

            // Bulk insert translations
            if (!empty($allTranslations)) {
                $this->translationRepo->addBulk($allTranslations);
            }

            DB::commit();

            // Report any translation failures
            $failureCount = $translationService->getFailureCount();
            if ($failureCount > 0) {
                Toastr::warning(translate('messages.some_translations_failed') . ': ' . $failureCount);
            }

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Category bulk update failed', ['error' => $e->getMessage()]);
            Toastr::error(translate('messages.failed_to_import_data'));
            return back();
        }

        Toastr::success(translate('messages.category_updated_successfully', ['count' => count($data)]));
        return back();
    }

    public function getBulkExportView(): View
    {
        return view(CategoryViewPath::BULK_EXPORT['view']);
    }

    /**
     * @throws IOException
     * @throws WriterNotOpenedException
     * @throws UnsupportedTypeException
     * @throws InvalidArgumentException
     */
    public function exportBulkData(CategoryBulkExportRequest $request): StreamedResponse|string
    {
        $categories = $this->categoryRepo->getBulkExportList(request: $request);
        return (new FastExcel($this->categoryService->getExportData(collection: $this->exportGenerator(data: $categories))))->download(Category::EXPORT_XLSX);
    }

    public function exportList(Request $request): BinaryFileResponse
    {
        $categories = $this->categoryRepo->getExportList(request: $request);

        $taxData = Helpers::getTaxSystemType();
        $categoryWiseTax = $taxData['categoryWiseTax'];

        $data = [
            'data' => $categories,
            'search' => $request['search'] ?? null,
            'categoryWiseTax' => $categoryWiseTax
        ];

        if ($request['type'] == 'csv') {
            return Excel::download(new CategoryExport($data), Category::EXPORT_CSV);
        }
        return Excel::download(new CategoryExport($data), Category::EXPORT_XLSX);
    }
}
