<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Subtes;
use App\Models\Soal;
use App\Models\OpsiJawaban;
use Illuminate\Support\Facades\DB;

class ImportSoal extends Command
{
    protected $signature = 'edvora:import-soal';
    protected $description = 'Import soal from CSV files into Supabase database';

    public function handle()
    {
        $this->info('Starting Soal Import...');

        // 1. Ensure Subtes exist
        $subtesPK = Subtes::firstOrCreate(
            ['nama_subtes' => 'Penalaran Kuantitatif'],
            ['kode_subtes' => 'PK', 'urutan' => 1, 'waktu_default_menit' => 20]
        );

        $subtesPM = Subtes::firstOrCreate(
            ['nama_subtes' => 'Penalaran Matematika'],
            ['kode_subtes' => 'PM', 'urutan' => 2, 'waktu_default_menit' => 25]
        );

        $files = [
            [
                'path' => database_path('soal/Penalaran Kuantitatif(Penalaran Kuantitatif).csv'),
                'subtes_id' => $subtesPK->id
            ],
            [
                'path' => database_path('soal/Penalaran Matematika(PM).csv'),
                'subtes_id' => $subtesPM->id
            ]
        ];

        $totalImported = 0;
        $seenKode = []; // to handle unique kode_soal

        // Pre-load existing kode_soal to avoid collisions with DB
        $existingKodes = Soal::pluck('kode_soal')->toArray();
        foreach($existingKodes as $k) {
            $seenKode[$k] = 1;
        }

        foreach ($files as $file) {
            if (!file_exists($file['path'])) {
                $this->error("File not found: {$file['path']}");
                continue;
            }

            $this->info("Processing: {$file['path']}");
            
            if (($handle = fopen($file['path'], 'r')) !== false) {
                $header = fgetcsv($handle, 1000, ';'); // Skip header
                
                DB::beginTransaction();
                try {
                    $rowCount = 0;
                    while (($data = fgetcsv($handle, 10000, ';')) !== false) {
                        $rowCount++;

                        // Handle empty row padding and character encoding
                        $data = array_pad($data, 19, '');
                        foreach ($data as $k => $v) {
                            $data[$k] = mb_convert_encoding($v, 'UTF-8', 'Windows-1252');
                        }

                        $teksSoal = trim($data[3]);
                        if (empty($teksSoal)) {
                            continue; // Skip empty rows
                        }

                        // Handle Kode Soal duplicates
                        $kodeSoal = trim($data[1]);
                        if (empty($kodeSoal)) {
                            $kodeSoal = 'SOAL-' . uniqid();
                        }
                        
                        if (isset($seenKode[$kodeSoal])) {
                            $seenKode[$kodeSoal]++;
                            $kodeSoal = $kodeSoal . '-' . $seenKode[$kodeSoal];
                        } else {
                            $seenKode[$kodeSoal] = 1;
                        }

                        // Map Enums
                        $tipeCsv = strtolower(trim($data[2]));
                        $tipe = 'pilihan_ganda'; // default
                        if (str_contains($tipeCsv, 'pilihan ganda')) {
                            $tipe = 'pilihan_ganda';
                        } elseif (str_contains($tipeCsv, 'isian')) {
                            $tipe = 'isian_singkat';
                        } elseif (str_contains($tipeCsv, 'esai')) {
                            $tipe = 'esai';
                        }

                        $kesulitanCsv = strtolower(trim($data[18]));
                        $kesulitan = in_array($kesulitanCsv, ['mudah', 'sedang', 'sulit']) ? $kesulitanCsv : 'sedang';

                        $kunci = trim($data[15]);
                        
                        $pembahasan = trim($data[17]);
                        if (empty($pembahasan)) {
                            $pembahasan = '-';
                        }

                        // Create Soal
                        $gambarSoal = trim($data[4]) ?: null;
                        if ($gambarSoal && strlen($gambarSoal) > 255) {
                            $gambarSoal = substr($gambarSoal, 0, 255);
                        }

                        $soal = Soal::create([
                            'kode_soal' => $kodeSoal,
                            'subtes_id' => $file['subtes_id'],
                            'editor_id' => null, // STRICT RULE: MUST BE NULL
                            'tipe' => $tipe,
                            'teks_soal' => $teksSoal,
                            'gambar_soal' => $gambarSoal,
                            'kunci_jawaban' => $kunci,
                            'hint' => trim($data[16]) ?: null,
                            'pembahasan' => $pembahasan,
                            'tingkat_kesulitan' => $kesulitan,
                            'status' => 'draft',
                        ]);

                        // Opsi Jawaban mapping
                        $opsiMap = [
                            'A' => ['teks' => trim($data[5]), 'gambar' => trim($data[6]), 'urutan' => 1],
                            'B' => ['teks' => trim($data[7]), 'gambar' => trim($data[8]), 'urutan' => 2],
                            'C' => ['teks' => trim($data[9]), 'gambar' => trim($data[10]), 'urutan' => 3],
                            'D' => ['teks' => trim($data[11]), 'gambar' => trim($data[12]), 'urutan' => 4],
                            'E' => ['teks' => trim($data[13]), 'gambar' => trim($data[14]), 'urutan' => 5],
                        ];

                        foreach ($opsiMap as $label => $opsi) {
                            if ($opsi['teks'] === '' && $opsi['gambar'] === '') {
                                continue; // Skip if completely empty
                            }

                            $gambarOpsi = $opsi['gambar'] ?: null;
                            if ($gambarOpsi && strlen($gambarOpsi) > 255) {
                                $gambarOpsi = substr($gambarOpsi, 0, 255);
                            }

                            OpsiJawaban::create([
                                'soal_id' => $soal->id,
                                'label' => $label,
                                'teks_opsi' => $opsi['teks'],
                                'gambar_opsi' => $gambarOpsi,
                                'is_kunci' => ($label === $kunci),
                                'urutan' => $opsi['urutan']
                            ]);
                        }

                        $totalImported++;
                    }
                    DB::commit();
                    $this->info("Imported $rowCount rows successfully from this file.");
                } catch (\Exception $e) {
                    DB::rollBack();
                    $this->error("Error importing row $rowCount: " . $e->getMessage());
                }
                
                fclose($handle);
            }
        }

        $this->info("Import completed! Total Soal inserted: $totalImported");
    }
}
