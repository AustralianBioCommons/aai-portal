import { expect, test, type Locator, type Page } from '@playwright/test';

const repeatPattern = (pattern: string, length: number): string =>
  pattern.repeat(Math.ceil(length / pattern.length)).slice(0, length);

async function setControlValue(locator: Locator, value: string): Promise<void> {
  await locator.evaluate((element, newValue) => {
    const input = element as HTMLInputElement | HTMLTextAreaElement;
    input.value = newValue;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

const errorMessage = (page: Page, text: string) =>
  page.locator('.text-xs.text-red-500', { hasText: text });

const fieldByLabel = (page: Page, label: string) =>
  page.getByLabel(label, { exact: false });

type SyncFn = (context: { page: Page; value: string }) => Promise<void>;

interface FieldConfig {
  name: string;
  label: string;
  invalidValue: string;
  validValue: string;
  error: string;
  locator?: (page: Page) => Locator;
  inputMethod?: 'fill' | 'set';
  sync?: SyncFn;
}

interface FormConfig {
  name: string;
  path: string;
  setup?: (page: Page) => Promise<void>;
  submitLocator: (page: Page) => Locator;
  blockedAssertion?: (context: {
    page: Page;
    initialUrl: string;
  }) => Promise<void>;
  fields: FieldConfig[];
  idnEmail?: {
    label: string;
    value: string;
  };
}

async function applyValue(
  locator: Locator,
  value: string,
  method: 'fill' | 'set' = 'fill',
): Promise<void> {
  if (method === 'set') {
    await setControlValue(locator, value);
  } else {
    await locator.fill(value);
  }
  try {
    await locator.blur();
  } catch {
    await locator.evaluate((node) =>
      (node as HTMLElement).dispatchEvent(new Event('blur', { bubbles: true })),
    );
  }
}

async function setField(
  page: Page,
  field: FieldConfig,
  value: string,
): Promise<void> {
  const locator = field.locator
    ? field.locator(page)
    : fieldByLabel(page, field.label);
  await applyValue(locator, value, field.inputMethod ?? 'fill');
  if (field.sync) {
    await field.sync({ page, value });
  }
}

async function fillAllFields(page: Page, form: FormConfig): Promise<void> {
  for (const field of form.fields) {
    await setField(page, field, field.validValue);
  }
}

async function attemptSubmission(
  page: Page,
  form: FormConfig,
  errorText: string,
): Promise<void> {
  const submitButton = form.submitLocator(page);
  const initialUrl = page.url();
  const enabled = await submitButton.isEnabled().catch(() => true);
  if (enabled) {
    await submitButton.click();
  } else {
    await expect(submitButton).toBeDisabled();
  }
  if (form.blockedAssertion) {
    await form.blockedAssertion({ page, initialUrl });
  } else {
    await expect(page).toHaveURL(initialUrl);
  }
  await expect(errorMessage(page, errorText)).not.toHaveCount(0);
}

const multiStepForm: FormConfig = {
  name: 'AAI multi-step registration',
  path: '/register',
  setup: async (page) => {
    await page.getByRole('button', { name: 'Select' }).first().click();
    await page.getByRole('heading', { name: 'Your details' }).waitFor();
  },
  submitLocator: (page) => page.getByRole('button', { name: 'Next' }),
  blockedAssertion: async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Your details' }),
    ).toBeVisible();
  },
  fields: [
    {
      name: 'first name length warning',
      label: 'First Name',
      invalidValue: repeatPattern('a', 260),
      validValue: 'First',
      error: 'First name cannot be longer than 255 characters',
    },
    {
      name: 'last name length warning',
      label: 'Last Name',
      invalidValue: repeatPattern('a', 260),
      validValue: 'Last',
      error: 'Last name cannot be longer than 255 characters',
    },
    {
      name: 'email local part length warning',
      label: 'Email Address',
      invalidValue: `${'a'.repeat(65)}@example.com`,
      validValue: 'user@example.com',
      error: 'Email local part cannot exceed 64 characters',
    },
    {
      name: 'email domain length warning',
      label: 'Email Address',
      invalidValue: `user@${'a'.repeat(255)}.com`,
      validValue: 'user@example.com',
      error: 'Email domain cannot exceed 254 characters',
    },
    {
      name: 'email format warning',
      label: 'Email Address',
      invalidValue: 'not-an-email',
      validValue: 'user@example.com',
      error: 'Please enter a valid email address',
    },
    {
      name: 'username length warning',
      label: 'Username',
      invalidValue: repeatPattern('abc', 129),
      validValue: 'validuser',
      error: 'Your username cannot be longer than 128 characters',
    },
    {
      name: 'username pattern warning',
      label: 'Username',
      invalidValue: 'InvalidName',
      validValue: 'validuser',
      error:
        'Your username must start with a lowercase letter and can only include lowercase letters, numbers, underscores, or dashes',
    },
    {
      name: 'password length warning',
      label: 'Password',
      invalidValue: repeatPattern('Aa0!', 80),
      validValue: 'Aa0!aaaa',
      error: 'Password cannot be longer than 72 characters',
      locator: (page) => page.getByLabel('Password *', { exact: true }),
      sync: async ({ page, value }) => {
        await applyValue(fieldByLabel(page, 'Confirm Password'), value);
      },
    },
    {
      name: 'password uppercase warning',
      label: 'Password',
      invalidValue: 'aa0!aaaa',
      validValue: 'Aa0!aaaa',
      error: 'Password must contain at least one uppercase letter',
      locator: (page) => page.getByLabel('Password *', { exact: true }),
      sync: async ({ page, value }) => {
        await applyValue(fieldByLabel(page, 'Confirm Password'), value);
      },
    },
    {
      name: 'confirm password length warning',
      label: 'Confirm Password',
      invalidValue: repeatPattern('Aa0!', 80),
      validValue: 'Aa0!aaaa',
      error: 'Confirm password cannot be longer than 72 characters',
    },
    {
      name: 'confirm password mismatch warning',
      label: 'Confirm Password',
      invalidValue: 'Mismatch1!',
      validValue: 'Aa0!aaaa',
      error: 'Passwords do not match',
    },
  ],
  idnEmail: {
    label: 'Email Address',
    value: 'user@bücher.de',
  },
};

const bpaForm: FormConfig = {
  name: 'BPA standard registration',
  path: '/bpa/register/standard-access',
  submitLocator: (page) => page.getByRole('button', { name: 'Register' }),
  blockedAssertion: async ({ page, initialUrl }) => {
    await expect(page).toHaveURL(initialUrl);
  },
  fields: [
    {
      name: 'username length warning',
      label: 'Username',
      invalidValue: repeatPattern('abc', 129),
      validValue: 'validuser',
      error: 'Your username cannot be longer than 128 characters',
    },
    {
      name: 'username pattern warning',
      label: 'Username',
      invalidValue: 'InvalidName',
      validValue: 'validuser',
      error:
        'Your username must start with a lowercase letter and can only include lowercase letters, numbers, underscores, or dashes',
    },
    {
      name: 'password length warning',
      label: 'Password',
      invalidValue: repeatPattern('Aa0!', 80),
      validValue: 'Aa0!aaaa',
      error: 'Password cannot be longer than 72 characters',
      locator: (page) => page.locator('input#password'),
      sync: async ({ page, value }) => {
        await applyValue(fieldByLabel(page, 'Confirm Password'), value);
      },
    },
    {
      name: 'confirm password length warning',
      label: 'Confirm Password',
      invalidValue: repeatPattern('Aa0!', 80),
      validValue: 'Aa0!aaaa',
      error: 'Confirm password cannot be longer than 72 characters',
    },
    {
      name: 'confirm password mismatch warning',
      label: 'Confirm Password',
      invalidValue: 'Mismatch1!',
      validValue: 'Aa0!aaaa',
      error: 'Passwords do not match',
    },
    {
      name: 'full name length warning',
      label: 'Full Name',
      invalidValue: repeatPattern('a', 260),
      validValue: 'John Doe',
      error: 'Full name cannot be longer than 255 characters',
    },
    {
      name: 'reason for request length warning',
      label: 'Reason for Request',
      invalidValue: repeatPattern('detail ', 260),
      validValue: 'Short reason',
      error: 'Reason for request cannot be longer than 255 characters',
      inputMethod: 'set',
    },
    {
      name: 'email local part length warning',
      label: 'Email',
      invalidValue: `${'a'.repeat(65)}@example.com`,
      validValue: 'user@example.com',
      error: 'Email local part cannot exceed 64 characters',
    },
    {
      name: 'email domain length warning',
      label: 'Email',
      invalidValue: `user@${'a'.repeat(255)}.com`,
      validValue: 'user@example.com',
      error: 'Email domain cannot exceed 254 characters',
    },
    {
      name: 'email format warning',
      label: 'Email',
      invalidValue: 'invalid-email',
      validValue: 'user@example.com',
      error: 'Please enter a valid email address',
    },
  ],
  idnEmail: {
    label: 'Email',
    value: 'user@bücher.de',
  },
};

const sbpForm: FormConfig = {
  name: 'SBP registration',
  path: '/sbp/register',
  submitLocator: (page) => page.getByRole('button', { name: 'Register' }),
  blockedAssertion: async ({ page, initialUrl }) => {
    await expect(page).toHaveURL(initialUrl);
  },
  fields: [
    {
      name: 'first name length warning',
      label: 'First Name',
      invalidValue: repeatPattern('a', 260),
      validValue: 'First',
      error: 'First name cannot be longer than 255 characters',
    },
    {
      name: 'last name length warning',
      label: 'Last Name',
      invalidValue: repeatPattern('a', 260),
      validValue: 'Last',
      error: 'Last name cannot be longer than 255 characters',
    },
    {
      name: 'email local part length warning',
      label: 'Email Address',
      invalidValue: `${'a'.repeat(65)}@unsw.edu.au`,
      validValue: 'user@unsw.edu.au',
      error: 'Email local part cannot exceed 64 characters',
    },
    {
      name: 'email domain restriction warning',
      label: 'Email Address',
      invalidValue: 'user@example.com',
      validValue: 'user@unsw.edu.au',
      error:
        'Email must be from an authorized institution domain (UNSW, BioCommons, USyd, WEHI, Monash, Griffith, or UoM)',
    },
    {
      name: 'email format warning',
      label: 'Email Address',
      invalidValue: 'not-an-email',
      validValue: 'user@unsw.edu.au',
      error: 'Please enter a valid email address',
    },
    {
      name: 'username length warning',
      label: 'Username',
      invalidValue: repeatPattern('abc', 129),
      validValue: 'validuser',
      error: 'Your username cannot be longer than 128 characters',
    },
    {
      name: 'username pattern warning',
      label: 'Username',
      invalidValue: 'InvalidName',
      validValue: 'validuser',
      error:
        'Your username must start with a lowercase letter and can only include lowercase letters, numbers, underscores, or dashes',
    },
    {
      name: 'reason for request length warning',
      label: 'Reason for Request',
      invalidValue: repeatPattern('detail ', 260),
      validValue: 'Short reason',
      error: 'Reason for request cannot be longer than 255 characters',
      inputMethod: 'set',
    },
    {
      name: 'password length warning',
      label: 'Password',
      invalidValue: repeatPattern('Aa0!', 80),
      validValue: 'Aa0!aaaa',
      error: 'Password cannot be longer than 72 characters',
      locator: (page) => page.locator('input#password'),
      sync: async ({ page, value }) => {
        await applyValue(fieldByLabel(page, 'Confirm Password'), value);
      },
    },
    {
      name: 'password uppercase warning',
      label: 'Password',
      invalidValue: 'aa0!aaaa',
      validValue: 'Aa0!aaaa',
      error: 'Password must contain at least one uppercase letter',
      locator: (page) => page.locator('input#password'),
      sync: async ({ page, value }) => {
        await applyValue(fieldByLabel(page, 'Confirm Password'), value);
      },
    },
    {
      name: 'confirm password length warning',
      label: 'Confirm Password',
      invalidValue: repeatPattern('Aa0!', 80),
      validValue: 'Aa0!aaaa',
      error: 'Confirm password cannot be longer than 72 characters',
    },
    {
      name: 'confirm password mismatch warning',
      label: 'Confirm Password',
      invalidValue: 'Mismatch1!',
      validValue: 'Aa0!aaaa',
      error: 'Passwords do not match',
    },
  ],
};

const galaxyForm: FormConfig = {
  name: 'Galaxy standard registration',
  path: '/galaxy/register/standard-access',
  submitLocator: (page) => page.getByRole('button', { name: 'Register' }),
  blockedAssertion: async ({ page, initialUrl }) => {
    await expect(page).toHaveURL(initialUrl);
  },
  fields: [
    {
      name: 'email local part length warning',
      label: 'Email',
      invalidValue: `${'a'.repeat(65)}@example.com`,
      validValue: 'user@example.com',
      error: 'Email local part cannot exceed 64 characters',
    },
    {
      name: 'email domain length warning',
      label: 'Email',
      invalidValue: `user@${'a'.repeat(255)}.com`,
      validValue: 'user@example.com',
      error: 'Email domain cannot exceed 254 characters',
    },
    {
      name: 'username length warning',
      label: 'Public Name (username)',
      invalidValue: repeatPattern('abc', 129),
      validValue: 'validuser',
      error: 'Your public name cannot be longer than 128 characters',
      locator: (page) => page.getByLabel('Public Name (username)'),
    },
    {
      name: 'username pattern warning',
      label: 'Public Name (username)',
      invalidValue: 'InvalidName',
      validValue: 'validuser',
      error:
        'Your public name must start with a lowercase letter and can only include lowercase letters, numbers, underscores, or dashes',
      locator: (page) => page.getByLabel('Public Name (username)'),
    },
    {
      name: 'password length warning',
      label: 'Password',
      invalidValue: repeatPattern('Aa0!', 80),
      validValue: 'Aa0!aaaa',
      error: 'Password cannot be longer than 72 characters',
      locator: (page) => page.locator('input#password'),
      sync: async ({ page, value }) => {
        await applyValue(fieldByLabel(page, 'Confirm Password'), value);
      },
    },
    {
      name: 'confirm password length warning',
      label: 'Confirm Password',
      invalidValue: repeatPattern('Aa0!', 80),
      validValue: 'Aa0!aaaa',
      error: 'Confirm password cannot be longer than 72 characters',
    },
    {
      name: 'confirm password mismatch warning',
      label: 'Confirm Password',
      invalidValue: 'Mismatch1!',
      validValue: 'Aa0!aaaa',
      error: 'Passwords do not match',
    },
  ],
  idnEmail: {
    label: 'Email',
    value: 'user@bücher.de',
  },
};

const forms: FormConfig[] = [multiStepForm, bpaForm, sbpForm, galaxyForm];

for (const form of forms) {
  test.describe(`${form.name} validation`, () => {
    for (const field of form.fields) {
      test(field.name, async ({ page }) => {
        await page.goto(form.path);
        if (form.setup) {
          await form.setup(page);
        }

        await fillAllFields(page, form);

        await setField(page, field, field.invalidValue);
        await expect(errorMessage(page, field.error)).not.toHaveCount(0);

        await attemptSubmission(page, form, field.error);

        await setField(page, field, field.validValue);
        await expect(errorMessage(page, field.error)).toHaveCount(0);
      });
    }

    if (form.idnEmail) {
      test('accepts IDN email address', async ({ page }) => {
        await page.goto(form.path);
        if (form.setup) {
          await form.setup(page);
        }

        await fillAllFields(page, form);

        const emailField = fieldByLabel(page, form.idnEmail.label);
        await applyValue(emailField, form.idnEmail.value, 'fill');

        await expect(
          page.locator('.text-xs.text-red-500').filter({ hasText: 'Email' }),
        ).toHaveCount(0);
      });
    }
  });
}
