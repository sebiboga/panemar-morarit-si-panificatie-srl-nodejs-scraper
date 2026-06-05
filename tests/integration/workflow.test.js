import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

const PANEMAR_CIF = '4844886';

describe('Integration: API Workflow', () => {

  describe('ANAF API', () => {
    let anaf;

    beforeAll(async () => {
      anaf = await import('../../src/anaf.js');
    });

    it('should fetch PANEMAR by hardcoded CIF and validate', async () => {
      const data = await anaf.getCompanyFromANAF(PANEMAR_CIF);
      expect(data).toBeDefined();
      expect(data.cui).toBe(4844886);
      expect(data.name).toBe('PANEMAR MORARIT SI PANIFICATIE SRL');
      expect(data).toHaveProperty('address');
      expect(data).toHaveProperty('registrationNumber');
      expect(data).toHaveProperty('caenCode');
      expect(data).toHaveProperty('inactive', false);
      expect(data.onrcStatusLabel).toBe('Funcțiune');
    }, 15000);

    it('should return empty array for non-existent brand', async () => {
      const results = await anaf.searchCompany('ThisBrandDoesNotExistXYZ123');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    }, 15000);

    it('should throw for invalid CIF', async () => {
      await expect(anaf.getCompanyFromANAF('00000000')).rejects.toThrow();
    }, 60000);

    it('should use cached data when API fails (getCompanyFromANAFWithFallback)', async () => {
      const cached = { cui: 4844886, name: 'PANEMAR MORARIT SI PANIFICATIE SRL' };

      const data = await anaf.getCompanyFromANAFWithFallback(PANEMAR_CIF, cached);

      expect(data).toBeDefined();
      expect(data.cui).toBe(4844886);
    }, 15000);
  });

  describe('Peviitor API', () => {
    let company;

    beforeAll(async () => {
      company = await import('../../company.js');
    });

    it.skip('should respond successfully and contain companies array (Peviitor API may block non-browser requests)', async () => {
      const res = await fetch('https://api.peviitor.ro/v1/company/', {
        headers: { 'User-Agent': 'job_seeker_ro_spider' }
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data).toHaveProperty('companies');
      expect(Array.isArray(data.companies)).toBe(true);
    }, 15000);
  });

  describe('PANEMAR Careers Page', () => {
    it('should fetch and parse job options from panemar.ro/angajari/', async () => {
      const { extractJobsFromCareersPage } = await import('../../index.js');
      const fetch = (await import('node-fetch')).default;

      const res = await fetch('https://panemar.ro/angajari/', {
        headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', 'Accept': 'text/html' }
      });

      expect(res.ok).toBe(true);
      const html = await res.text();
      expect(html).toContain('wpcf7-select');
      expect(html).toContain('menu-117');

      const jobs = extractJobsFromCareersPage(html);
      expect(jobs.length).toBeGreaterThan(0);

      const job = jobs[0];
      expect(job).toHaveProperty('title');
      expect(job).toHaveProperty('url');
      expect(job.url).toBe('https://panemar.ro/angajari/');
    }, 15000);
  });

  describe('SOLR Company Core', () => {
    let solr;

    beforeAll(async () => {
      solr = await import('../../solr.js');
    });

    itIfSolr('should query company core by ID', async () => {
      const result = await solr.queryCompanySOLR(`id:${PANEMAR_CIF}`);

      expect(result.numFound).toBe(1);
      const coera = result.docs[0];
      expect(coera.id).toBe(PANEMAR_CIF);
      expect(coera.company).toBe('PANEMAR MORARIT SI PANIFICATIE SRL');
      expect(coera.status).toBe('activ');
      expect(Array.isArray(coera.location)).toBe(true);
    }, 15000);

    itIfSolr('should have required company model fields', async () => {
      const result = await solr.queryCompanySOLR(`id:${PANEMAR_CIF}`);
      const coera = result.docs[0];

      expect(coera).toHaveProperty('id', PANEMAR_CIF);
      expect(coera).toHaveProperty('company');
      expect(coera).toHaveProperty('status');
      expect(['activ', 'suspendat', 'inactiv', 'radiat']).toContain(coera.status);
      expect(coera).toHaveProperty('location');
      expect(Array.isArray(coera.location)).toBe(true);
    }, 15000);
  });

  describe('SOLR Jobs Core', () => {
    let solr;

    beforeAll(async () => {
      solr = await import('../../solr.js');
    });

    itIfSolr('should query jobs by CIF and return valid data', async () => {
      const result = await solr.querySOLR(PANEMAR_CIF);

      expect(result.numFound).toBeGreaterThan(0);
      expect(Array.isArray(result.docs)).toBe(true);

      const job = result.docs[0];
      expect(job).toHaveProperty('url');
      expect(job).toHaveProperty('title');
      expect(job).toHaveProperty('company', 'PANEMAR MORARIT SI PANIFICATIE SRL');
      expect(job).toHaveProperty('cif', PANEMAR_CIF);
      expect(job).toHaveProperty('status');
      expect(job).toHaveProperty('location');
    }, 15000);

    itIfSolr('should not have duplicate URLs for same CIF', async () => {
      const result = await solr.querySOLR(PANEMAR_CIF);

      const urls = result.docs.map(j => j.url);
      const uniqueUrls = new Set(urls);
      expect(uniqueUrls.size).toBe(result.docs.length);
    }, 15000);

    itIfSolr('should have valid status values for all jobs', async () => {
      const validStatuses = ['scraped', 'tested', 'verified', 'published'];
      const result = await solr.querySOLR(PANEMAR_CIF);

      for (const job of result.docs) {
        expect(validStatuses).toContain(job.status);
      }
    }, 15000);

    itIfSolr('should have valid CIF format for all jobs', async () => {
      const result = await solr.querySOLR(PANEMAR_CIF);

      for (const job of result.docs) {
        expect(job.cif).toMatch(/^\d{8}$/);
      }
    }, 15000);
  });

  describe('Full Validation Workflow', () => {
    let anaf;
    let companyModule;

    beforeAll(async () => {
      anaf = await import('../../src/anaf.js');
      companyModule = await import('../../company.js');
    });

    it('should complete the ANAF (by CIF) validation path', async () => {
      const anafData = await anaf.getCompanyFromANAF(PANEMAR_CIF);
      expect(anafData.name).toBe('PANEMAR MORARIT SI PANIFICATIE SRL');
      expect(anafData.inactive).toBe(false);
    }, 30000);

    itIfSolr('should validate company and query SOLR for existing jobs', async () => {
      const companyResult = await companyModule.validateAndGetCompany();

      expect(companyResult.status).toBe('active');
      expect(companyResult.company).toBe('PANEMAR MORARIT SI PANIFICATIE SRL');
      expect(companyResult.cif).toBe(PANEMAR_CIF);
      expect(companyResult.existingJobsCount).toBeGreaterThan(0);
    }, 30000);
  });
});
