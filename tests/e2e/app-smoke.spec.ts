import { expect, test } from '@playwright/test';

const buildVersionPattern = /BioCommons Access Portal build version:\s+(.+)/;

test('displays the portal shell', async ({ page }) => {
  const consoleMessages: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'info') {
      consoleMessages.push(message.text());
    }
  });

  await page.goto('/');

  await expect(page.locator('app-root')).toBeVisible();
  await expect(page).toHaveTitle(/BioCommons Access Portal/i);

  const versionMessage = consoleMessages.find((msg) =>
    buildVersionPattern.test(msg),
  );
  if (versionMessage) {
    const [, version] = versionMessage.match(buildVersionPattern) ?? [];
    if (version) {
      test
        .info()
        .annotations.push({ type: 'build-version', description: version });
    }
  }
});
