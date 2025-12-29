<?php

namespace App\Repositories;

use App\Contracts\Repositories\TranslationRepositoryInterface;
use App\Models\Translation;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class TranslationRepository implements TranslationRepositoryInterface
{

    public function __construct(protected Translation $translation)
    {
    }

    public function addByModel(Request $request, object $model, string $modelPath, string $attribute): bool
    {
        $defaultLang = str_replace('_', '-', app()->getLocale());
        $data = [];
        foreach ($request->lang as $index => $key) {
            if ($defaultLang == $key && !($request[$attribute][$index])) {
                if ($key != 'default') {
                    $data[] = array(
                        'translationable_type' => $modelPath,
                        'translationable_id' => $model->id,
                        'locale' => $key,
                        'key' => $attribute,
                        'value' => $model[$attribute],
                    );
                }
            } else {
                if ($request[$attribute][$index] && $key != 'default') {
                    $data[] = array(
                        'translationable_type' => $modelPath,
                        'translationable_id' => $model->id,
                        'locale' => $key,
                        'key' => $attribute,
                        'value' => $request[$attribute][$index],
                    );
                }
            }
        }
        if (count($data)) {
            $this->translation->insert($data);
        }
        return true;
    }

    public function updateByModel(Request $request, object $model, string $modelPath, string $attribute): bool
    {
        $defaultLang = str_replace('_', '-', app()->getLocale());
        foreach ($request->lang as $index => $key) {
            if ($defaultLang == $key && !($request[$attribute][$index])) {
                if ($key != 'default') {
                    Translation::updateOrInsert(
                        ['translationable_type' => $modelPath,
                            'translationable_id' => $model->id,
                            'locale' => $key,
                            'key' => $attribute],
                        ['value' => $model[$attribute]]
                    );
                }
            } else {

                if ($request[$attribute][$index] && $key != 'default') {
                    Translation::updateOrInsert(
                        ['translationable_type' => $modelPath,
                            'translationable_id' => $model->id,
                            'locale' => $key,
                            'key' => $attribute],
                        ['value' => $request[$attribute][$index]]
                    );
                }
            }
        }
        return true;
    }

    public function add(array $data): string|object
    {

    }

    public function getFirstWhere(array $params, array $relations = []): ?Model
    {
        // TODO: Implement getFirstWhere() method.
    }

    public function getList(array $orderBy = [], array $relations = [], int|string $dataLimit = DEFAULT_DATA_LIMIT, int $offset = null): Collection|LengthAwarePaginator
    {
        // TODO: Implement getList() method.
    }

    public function getListWhere(string $searchValue = null, array $filters = [], array $relations = [], int|string $dataLimit = DEFAULT_DATA_LIMIT, int $offset = null): Collection|LengthAwarePaginator
    {
        // TODO: Implement getListWhere() method.
    }

    public function update(string $id, array $data): bool
    {
        // TODO: Implement update() method.
    }

    public function delete(string $id): bool
    {
        // TODO: Implement delete() method.
    }

    /**
     * Add translations in bulk
     * @param array $translations Array of translation records
     * @return bool
     */
    public function addBulk(array $translations): bool
    {
        if (empty($translations)) {
            return true;
        }

        $chunkSize = 100;
        $chunks = array_chunk($translations, $chunkSize);

        foreach ($chunks as $chunk) {
            $this->translation->insert($chunk);
        }

        return true;
    }
}
