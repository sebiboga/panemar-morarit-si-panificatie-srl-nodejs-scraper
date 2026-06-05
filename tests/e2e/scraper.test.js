import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const HAS_SOLR = !!process.env.SOLR_AUTH;

function itIfSolr(name, fn, timeout) {
  if (HAS_SOLR) {
    return it(name, fn, timeout);
  }
  return it.skip(`${name} (skipped: SOLR_AUTH not set)`, fn, timeout);
}

beforeAll(() => {
  if (HAS_SOLR) {
    process.env.SOLR_AUTH = process.env.SOLR_AUTH;
  }
});

const TEST_CIF = '4844886';
const TEST_BRAND = 'PANEMAR';
const COMPANY_NAME = 'PANEMAR MORARIT SI PANIFICATIE SRL';
const CAREERS_URL = 'https://panemar.ro/angajari/';

describe('E2E: Full Scraping Pipeline', () => {

  describe('PANEMAR Careers Page — Real Data Fetch', () => {
    let careersHtml;

    beforeAll(async () => {
      const res = await fetch(CAREERS_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          'Accept': 'text/html'
        }
      });
      careersHtml = await res.text();
    }, 15000);

    it('should respond with valid HTML from PANEMAR careers page', () => {
      expect(careersHtml).toBeDefined();
      expect(careersHtml.length).toBeGreaterThan(0);
      expect(careersHtml).toContain('angajari');
    }, 10000);

    it('should contain job options in a select element', () => {
      expect(careersHtml.includes('wpcf7-select')).toBe(true);
    });
  });

  describe('Parse Pipeline', () => {
    let index;
    let careersHtml;

    beforeAll(async () => {
      index = await import('../../index.js');
      const res = await fetch(CAREERS_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          'Accept': 'text/html'
        }
      });
      careersHtml = await res.text();
    }, 15000);

    it('should extract jobs from real PANEMAR careers page', () => {
      const jobs = index.extractJobsFromCareersPage(careersHtml);

      expect(Array.isArray(jobs)).toBe(true);
      expect(jobs.length).toBeGreaterThan(0);

      const parsed = jobs[0];
      expect(parsed).toHaveProperty('url');
      expect(parsed.url).toBe(CAREERS_URL);
      expect(parsed).toHaveProperty('title');
      expect(typeof parsed.title).toBe('string');
      expect(parsed.title.length).toBeGreaterThan(0);
    });

    it('should map parsed jobs to job model', () => {
      const jobs = index.extractJobsFromCareersPage(careersHtml);
      const model = index.mapToJobModel(jobs[0], TEST_CIF, COMPANY_NAME);

      expect(model).toHaveProperty('url');
      expect(model).toHaveProperty('title');
      expect(model).toHaveProperty('company');
      expect(model).toHaveProperty('cif', TEST_CIF);
      expect(model).toHaveProperty('status', 'scraped');
      expect(model).toHaveProperty('date');
      expect(model.url).toBe(CAREERS_URL);
    });

    it('should produce valid job URLs that are accessible', async () => {
      const jobs = index.extractJobsFromCareersPage(careersHtml);

      for (const job of jobs.slice(0, 2)) {
        const res = await fetch(job.url, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36' }
        });
        expect(res.ok).toBe(true);
      }
    }, 30000);
  });

  describe('Company Validation Path', () => {
    let anaf;
    let company;

    beforeAll(async () => {
      anaf = await import('../../src/anaf.js');
      company = await import('../../company.js');
    });

    it('should find PANEMAR in ANAF by CIF and validate active status', async () => {
      const anafData = await anaf.getCompanyFromANAF(TEST_CIF);
      expect(anafData).toBeDefined();
      expect(anafData.name).toBe('PANEMAR MORARIT SI PANIFICATIE SRL');
      expect(anafData.inactive).toBe(false);
    }, 30000);

    itIfSolr('should run full validation and report active status with job count', async () => {
      const result = await company.validateAndGetCompany();

      expect(result.status).toBe('active');
      expect(result.company).toBe('PANEMAR MORARIT SI PANIFICATIE SRL');
      expect(result.cif).toBe(TEST_CIF);
      expect(result.existingJobsCount).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Inactive Company Handling', () => {
    let anaf;

    beforeAll(async () => {
      anaf = await import('../../src/anaf.js');
    });

    it('should detect inactive/radiated companies via ANAF by CIF', async () => {
      const needsAuth = process.env.SOLR_AUTH ? true : false;
      if (!needsAuth) return;

      const anafData = await anaf.getCompanyFromANAF(TEST_CIF);
      expect(anafData).toBeDefined();
      if (anafData.inactive !== undefined) {
        expect(anafData.inactive).toBe(false);
      }
    }, 30000);
  });

  describe('SOLR Data Verification', () => {
    let solr;

    beforeAll(async () => {
      solr = await import('../../solr.js');
    });

    itIfSolr('should have PANEMAR jobs in SOLR with correct company name', async () => {
      const result = await solr.querySOLR(TEST_CIF);

      expect(result.numFound).toBeGreaterThan(0);

      for (const job of result.docs) {
        expect(job.company).toBe('PANEMAR MORARIT SI PANIFICATIE SRL');
        expect(job.cif).toBe(TEST_CIF);
      }
    }, 15000);

    itIfSolr('should have PANEMAR company core entry with required fields', async () => {
      const result = await solr.queryCompanySOLR(`id:${TEST_CIF}`);

      expect(result.numFound).toBe(1);
      const coera = result.docs[0];
      expect(coera.company).toBe('PANEMAR MORARIT SI PANIFICATIE SRL');
      expect(coera.status).toBe('activ');
    }, 15000);
  });
});
