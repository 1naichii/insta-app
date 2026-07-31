<?php

declare(strict_types=1);

return [
    'enabled' => env('BOOST_ENABLED', env('APP_ENV', 'production') !== 'production'),
    'browser_logs_watcher' => env(
        'BOOST_BROWSER_LOGS_WATCHER',
        env('APP_ENV', 'production') !== 'production',
    ),
    'rules' => [
        'enabled' => env('BOOST_RULES_ENABLED', false),
    ],
    'executable_paths' => [
        'php' => env('BOOST_PHP_EXECUTABLE_PATH'),
        'composer' => env('BOOST_COMPOSER_EXECUTABLE_PATH'),
        'npm' => env('BOOST_NPM_EXECUTABLE_PATH'),
        'vendor_bin' => env('BOOST_VENDOR_BIN_EXECUTABLE_PATH'),
        'current_directory' => env('BOOST_CURRENT_DIRECTORY_EXECUTABLE_PATH'),
    ],
    'browser_log_levels' => explode(',', (string) env('BOOST_BROWSER_LOG_LEVELS', 'error,warning,info,debug')),
];
