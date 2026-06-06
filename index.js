import fetch from "node-fetch";
import fs from "fs";
import { fileURLToPath } from "url";
import { validateAndGetCompany } from "./company.js";
import { querySOLR, upsertJobs, upsertCompany } from "./solr.js";

const COMPANY_CIF = "4844886";
const COMPANY_NAME = "PANEMAR MORARIT SI PANIFICATIE SRL";
const COMPANY_BRAND = "PANEMAR";
const CAREERS_URL = "https://panemar.ro/angajari/";
const WEBSITE_URL = "https://panemar.ro";

function extractJobsFromCareersPage(html) {
  const optionRegex = /<option\s+value="([^"]*)"(?:\s[^>]*)?>([^<]+)<\/option>/g;
  const jobs = [];
  const seen = new Set();

  let match;
  while ((match = optionRegex.exec(html)) !== null) {
    const title = match[2].trim();
    if (!title || seen.has(title)) continue;
    seen.add(title);

    const fragment = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    jobs.push({
      title,
      url: `${CAREERS_URL}#${fragment}`
    });
  }

  return jobs;
}

async function fetchCareersPage() {
  const res = await fetch(CAREERS_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
      "Accept": "text/html"
    }
  });

  if (!res.ok) {
    throw new Error(`HTTP error ${res.status} for careers page`);
  }

  return await res.text();
}

function mapToJobModel(rawJob, cif, companyName) {
  const now = new Date().toISOString();

  const job = {
    url: rawJob.url,
    title: rawJob.title,
    company: companyName,
    cif: cif,
    location: ["Cluj-Napoca"],
    country: ["România"],
    date: now,
    status: "scraped"
  };

  Object.keys(job).forEach((k) => job[k] === undefined && delete job[k]);

  return job;
}

async function main() {
  try {
    console.log("=== Step 1: Get existing jobs count ===");
    const existingResult = await querySOLR(COMPANY_CIF);
    const existingCount = existingResult.numFound;
    console.log(`Found ${existingCount} existing jobs in SOLR`);

    console.log("=== Step 2: Validate company via ANAF ===");
    const { company, cif, address } = await validateAndGetCompany();

    try {
      await upsertCompany({
        id: cif,
        company,
        brand: COMPANY_BRAND,
        status: "activ",
        location: address ? [address] : ["Cluj-Napoca"],
        website: [WEBSITE_URL],
        career: [CAREERS_URL],
        lastScraped: new Date().toISOString().split('T')[0],
        scraperFile: "https://raw.githubusercontent.com/sebiboga/panemar-morarit-si-panificatie-srl-nodejs-scraper/main/.github/workflows/scrape.yml"
      });
    } catch (err) {
      console.log(`Note: Could not upsert company to SOLR core: ${err.message}`);
    }

    console.log("\n=== Step 3: Fetch jobs from panemar.ro/angajari/ ===");
    const html = await fetchCareersPage();
    const rawJobs = extractJobsFromCareersPage(html);
    console.log(`Found ${rawJobs.length} jobs on careers page`);
    rawJobs.forEach((j, i) => console.log(`  ${i + 1}. ${j.title} - ${j.url}`));

    const mappedJobs = rawJobs.map(job => mapToJobModel(job, cif, COMPANY_NAME));

    const payload = {
      source: CAREERS_URL,
      scrapedAt: new Date().toISOString(),
      company: COMPANY_NAME,
      cif: cif,
      jobs: mappedJobs
    };

    console.log(`\n📊 Jobs count: ${payload.jobs.length}`);

    fs.writeFileSync("tmp/jobs.json", JSON.stringify(payload, null, 2), "utf-8");
    console.log("Saved tmp/jobs.json");

    console.log("\n=== Step 4: Upsert jobs to SOLR ===");
    await upsertJobs(payload.jobs);

    const finalResult = await querySOLR(COMPANY_CIF);
    console.log(`\n📊 === SUMMARY ===`);
    console.log(`📊 Jobs existing in SOLR before scrape: ${existingCount}`);
    console.log(`📊 Jobs scraped total: ${rawJobs.length}`);
    console.log(`📊 Jobs in SOLR after scrape: ${finalResult.numFound}`);
    console.log(`====================`);

    console.log("\n=== DONE ===");
    console.log("Scraper completed successfully!");
  } catch (err) {
    console.error("Scraper failed:", err);
    process.exit(1);
  }
}

export { extractJobsFromCareersPage, mapToJobModel };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
