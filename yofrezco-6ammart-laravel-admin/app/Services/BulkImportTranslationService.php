<?php

namespace App\Services;

use App\CentralLogics\Helpers;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BulkImportTranslationService
{
    protected string $sourceLocale;
    protected string $targetLocale;
    protected array $failures = [];
    protected float $lastCallTime = 0;

    public function __construct(string $sourceLocale = 'es', string $targetLocale = 'en')
    {
        $this->sourceLocale = $sourceLocale;
        $this->targetLocale = $targetLocale;
    }

    /**
     * Translate a single text with retry logic and rate limiting
     */
    public function translate(string $text, int $retries = 2): ?string
    {
        if (empty(trim($text))) {
            return null;
        }

        // Rate limiting - ensure minimum 100ms between API calls
        $now = microtime(true);
        $elapsed = $now - $this->lastCallTime;
        if ($elapsed < 0.1 && $this->lastCallTime > 0) {
            usleep((int)((0.1 - $elapsed) * 1000000));
        }
        $this->lastCallTime = microtime(true);

        $attempt = 0;
        while ($attempt <= $retries) {
            try {
                $translated = Helpers::auto_translator($text, $this->sourceLocale, $this->targetLocale);
                if ($translated && !empty(trim($translated))) {
                    return $translated;
                }
                return $text; // If empty result, return original
            } catch (\Exception $e) {
                $attempt++;
                if ($attempt > $retries) {
                    Log::warning("Translation failed after {$retries} retries", [
                        'text' => substr($text, 0, 100),
                        'error' => $e->getMessage()
                    ]);
                    $this->failures[] = ['text' => substr($text, 0, 100), 'error' => $e->getMessage()];
                    return null;
                }
                usleep(500000); // 0.5 second delay between retries
            }
        }
        return null;
    }

    /**
     * Prepare translation records for a single entity
     */
    public function prepareTranslationRecords(
        int $recordId,
        string $modelPath,
        array $fieldsToTranslate
    ): array {
        $records = [];

        foreach ($fieldsToTranslate as $field => $value) {
            if (empty($value) || empty(trim($value))) {
                continue;
            }

            // Source language (Spanish) translation
            $records[] = [
                'translationable_type' => $modelPath,
                'translationable_id' => $recordId,
                'locale' => $this->sourceLocale,
                'key' => $field,
                'value' => $value,
            ];

            // Target language (English) translation
            $translatedValue = $this->translate($value);
            if ($translatedValue !== null) {
                $records[] = [
                    'translationable_type' => $modelPath,
                    'translationable_id' => $recordId,
                    'locale' => $this->targetLocale,
                    'key' => $field,
                    'value' => $translatedValue,
                ];
            }
        }

        return $records;
    }

    /**
     * Process translations for multiple records
     */
    public function processTranslationsForRecords(
        array $insertedIds,
        array $translationFields,
        string $modelPath
    ): array {
        $allTranslations = [];

        foreach ($insertedIds as $index => $insertedId) {
            if (!isset($translationFields[$index]) || empty($translationFields[$index])) {
                continue;
            }

            $translations = $this->prepareTranslationRecords(
                $insertedId,
                $modelPath,
                $translationFields[$index]
            );
            $allTranslations = array_merge($allTranslations, $translations);
        }

        return $allTranslations;
    }

    /**
     * Insert translations in bulk
     */
    public function insertBulkTranslations(array $translations): bool
    {
        if (empty($translations)) {
            return true;
        }

        $chunkSize = 100;
        $chunks = array_chunk($translations, $chunkSize);

        foreach ($chunks as $chunk) {
            DB::table('translations')->insert($chunk);
        }

        return true;
    }

    /**
     * Get translation failures
     */
    public function getFailures(): array
    {
        return $this->failures;
    }

    /**
     * Get failure count
     */
    public function getFailureCount(): int
    {
        return count($this->failures);
    }

    /**
     * Reset failures
     */
    public function resetFailures(): void
    {
        $this->failures = [];
    }
}
