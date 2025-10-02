#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function usage(message) {
  const lines = [
    message,
    "Usage: node tools/render-app-config.js --config <path> (--secret-file <path> | --secret-json <json>) [--set-production <true|false>]",
  ].filter(Boolean);
  console.error(lines.join("\n"));
  process.exit(1);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    switch (key) {
      case "--config":
        if (!next) {
          usage("Missing value for --config");
        }
        args.config = next;
        i += 1;
        break;
      case "--secret-file":
        if (!next) {
          usage("Missing value for --secret-file");
        }
        args.secretFile = next;
        i += 1;
        break;
      case "--secret-json":
        if (!next) {
          usage("Missing value for --secret-json");
        }
        args.secretJson = next;
        i += 1;
        break;
      case "--set-production":
        if (!next) {
          usage("Missing value for --set-production");
        }
        args.production = next.toLowerCase();
        i += 1;
        break;
      default:
        usage(`Unknown argument: ${key}`);
    }
  }
  return args;
}

function loadSecret(args) {
  if (args.secretFile && args.secretJson) {
    usage("Provide either --secret-file or --secret-json, not both.");
  }

  let raw;
  if (args.secretFile) {
    const filePath = path.resolve(args.secretFile);
    if (!fs.existsSync(filePath)) {
      usage(`Secret file not found: ${filePath}`);
    }
    raw = fs.readFileSync(filePath, "utf8");
  } else if (args.secretJson) {
    raw = args.secretJson;
  } else {
    usage("Either --secret-file or --secret-json must be supplied.");
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    usage(`Failed to parse secret JSON: ${(error && error.message) || error}`);
    return {};
  }
}

function setNestedValue(target, keys, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }
  let current = target;
  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    if (
      !Object.prototype.hasOwnProperty.call(current, key) ||
      typeof current[key] !== "object"
    ) {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.config) {
    usage("Missing required --config argument.");
  }

  const configPath = path.resolve(args.config);
  if (!fs.existsSync(configPath)) {
    usage(`Configuration file not found: ${configPath}`);
  }

  const secret = loadSecret(args);

  const rawConfig = fs.readFileSync(configPath, "utf8");
  let config;
  try {
    config = JSON.parse(rawConfig);
  } catch (error) {
    usage(
      `Failed to parse existing config JSON: ${(error && error.message) || error}`,
    );
    return;
  }

  const mapping = [
    { secretKey: "DOMAIN", path: ["auth0", "domain"] },
    { secretKey: "CLIENT_ID", path: ["auth0", "clientId"] },
    { secretKey: "REDIRECT_URI", path: ["auth0", "redirectUri"] },
    { secretKey: "BACKEND", path: ["auth0", "backend"] },
    { secretKey: "BACKEND_URL", path: ["auth0", "backend"] },
    { secretKey: "RECAPTCHA_KEY", path: ["recaptcha", "siteKeyV2"] },
  ];

  for (const { secretKey, path: pathParts } of mapping) {
    const value = secret[secretKey];
    if (value !== undefined && value !== null && value !== "") {
      setNestedValue(config, pathParts, value);
    }
  }

  if (args.production !== undefined) {
    const boolValue = args.production === "true";
    config.production = boolValue;
  }

  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

main();
