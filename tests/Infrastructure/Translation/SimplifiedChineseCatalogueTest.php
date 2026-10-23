<?php

declare(strict_types=1);

namespace App\Tests\Infrastructure\Translation;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Translation\Loader\YamlFileLoader;

final class SimplifiedChineseCatalogueTest extends TestCase
{
    /** @return iterable<string, array{string}> */
    public static function domains(): iterable
    {
        foreach (['messages', 'security', 'validators'] as $domain) {
            yield $domain => [$domain];
        }
    }

    #[DataProvider('domains')]
    public function testAllKeysAndInterpolationTokensArePreserved(string $domain): void
    {
        $loader = new YamlFileLoader();
        $directory = dirname(__DIR__, 3) . '/translations/';
        $english = $loader->load($directory . $domain . '.en.yaml', 'en', $domain)->all($domain);
        $chinese = $loader->load($directory . $domain . '.zh_CN.yaml', 'zh_CN', $domain)->all($domain);
        ksort($english);
        ksort($chinese);

        self::assertSame(array_keys($english), array_keys($chinese));

        foreach ($english as $key => $message) {
            self::assertSame(
                self::tokens((string) $message),
                self::tokens((string) $chinese[$key]),
                $domain . ':' . $key . ' must preserve interpolation tokens',
            );
        }
    }

    /** @return list<string> */
    private static function tokens(string $message): array
    {
        preg_match_all('/%[A-Za-z_][A-Za-z0-9_]*%|\{\{\s*[A-Za-z_][A-Za-z0-9_]*\s*\}\}|\{\s*[A-Za-z_][A-Za-z0-9_]*\s*\}/', $message, $matches);
        $tokens = $matches[0];
        sort($tokens);

        return $tokens;
    }
}
