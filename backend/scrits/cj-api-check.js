const fs = require("fs");
const path = require("path");

const DEFAULT_QUERY = "denim jacket";
const DEFAULT_LIMIT = 5;

function loadEnv() {
  const backendDir = path.resolve(__dirname, "..");
  const envPath = path.join(backendDir, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function buildToken(rawToken) {
  if (!rawToken) return "";
  return rawToken.startsWith("Bearer ") ? rawToken : `Bearer ${rawToken}`;
}

async function main() {
  loadEnv();

  const query = process.argv.slice(2).join(" ").trim() || DEFAULT_QUERY;
  const limit = Number(process.env.CJ_PRODUCT_LIMIT ?? DEFAULT_LIMIT) || DEFAULT_LIMIT;
  const apiUrl = process.env.CJ_API_URL || "https://ads.api.cj.com/query";
  const token = buildToken(process.env.CJ_AUTH_TOKEN || "");
  const companyId = process.env.CJ_COMPANY_ID || "";
  const partnerStatus = process.env.CJ_PARTNER_STATUS || "JOINED";
  const availability = process.env.CJ_AVAILABILITY || "IN_STOCK";
  const sortBy = process.env.CJ_SORT_BY || "";
  const sortOrder = process.env.CJ_SORT_ORDER || "";
  const advertiserCountries = process.env.CJ_ADVERTISER_COUNTRIES
    ? process.env.CJ_ADVERTISER_COUNTRIES.split(",").map((item) => item.trim()).filter(Boolean)
    : undefined;
  const currency = process.env.CJ_CURRENCY || undefined;

  if (!companyId || !token) {
    console.error("Missing CJ_COMPANY_ID or CJ_AUTH_TOKEN in backend/.env");
    process.exit(1);
  }

  const gqlWithSort = `
    query Products(
      $companyId: ID!
      $keywords: [String!]
      $limit: Int
      $partnerStatus: PartnerStatus
      $availability: Availability
      $sortBy: SortBy
      $sortOrder: SortOrder
      $advertiserCountries: [String!]
      $currency: String
    ) {
      products(
        companyId: $companyId
        keywords: $keywords
        limit: $limit
        partnerStatus: $partnerStatus
        availability: $availability
        sortBy: $sortBy
        sortOrder: $sortOrder
        advertiserCountries: $advertiserCountries
        currency: $currency
      ) {
        resultList {
          id
          title
          brand
          imageLink
          link
          linkCode(pid: $companyId) { clickUrl }
          price { amount currency }
          salePrice { amount currency }
          advertiserName
        }
        totalCount
        count
      }
    }
  `;
  const gqlNoSort = `
    query Products(
      $companyId: ID!
      $keywords: [String!]
      $limit: Int
      $partnerStatus: PartnerStatus
      $availability: Availability
      $advertiserCountries: [String!]
      $currency: String
    ) {
      products(
        companyId: $companyId
        keywords: $keywords
        limit: $limit
        partnerStatus: $partnerStatus
        availability: $availability
        advertiserCountries: $advertiserCountries
        currency: $currency
      ) {
        resultList {
          id
          title
          brand
          imageLink
          link
          linkCode(pid: $companyId) { clickUrl }
          price { amount currency }
          salePrice { amount currency }
          advertiserName
        }
        totalCount
        count
      }
    }
  `;

  const useSorting = Boolean(sortBy && sortOrder);
  const variables = {
    companyId,
    keywords: [query],
    limit,
    partnerStatus,
    availability,
    advertiserCountries,
    currency,
  };
  if (useSorting) {
    variables.sortBy = sortBy;
    variables.sortOrder = sortOrder;
  }

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ query: useSorting ? gqlWithSort : gqlNoSort, variables }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`CJ API error ${res.status}: ${text.slice(0, 400)}`);
    process.exit(1);
  }

  const json = await res.json();
  if (json.errors?.length) {
    console.error("CJ API returned errors:");
    for (const err of json.errors) {
      console.error(`- ${err.message}`);
    }
    process.exit(1);
  }

  const products = json.data?.products?.resultList || [];
  const total = json.data?.products?.totalCount ?? 0;
  console.log(`CJ API OK: ${products.length} items (total ${total}) for "${query}"`);

  for (const item of products) {
    const price = item.salePrice?.amount ?? item.price?.amount;
    const currencyCode = item.salePrice?.currency ?? item.price?.currency ?? "";
    const clickUrl = item.linkCode?.clickUrl || item.link || "";
    console.log(
      `- ${item.title || "Untitled"} | ${item.brand || "Unknown"} | ${price || "?"} ${currencyCode} | ${item.advertiserName || "Unknown"}`
    );
    if (clickUrl) {
      console.log(`  ${clickUrl}`);
    }
  }
}

main().catch((err) => {
  console.error("CJ API check failed:", err);
  process.exit(1);
});
