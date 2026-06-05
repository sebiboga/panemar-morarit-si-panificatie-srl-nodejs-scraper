import { jest } from '@jest/globals';

const mockFetch = jest.fn();

jest.unstable_mockModule('node-fetch', () => ({
  default: mockFetch
}));

function makeSolrResponse(numFound, docs) {
  return {
    ok: true,
    json: async () => ({ response: { numFound, docs } })
  };
}

function makeErrorResponse(status, text) {
  return {
    ok: false,
    status,
    text: async () => text
  };
}

describe('solr.js', () => {
  let solr;

  beforeAll(async () => {
    process.env.SOLR_AUTH = 'test:test';
    solr = await import('../../solr.js');
  });

  afterAll(() => {
    delete process.env.SOLR_AUTH;
  });

  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('getSolrAuth', () => {
    it('should return SOLR_AUTH from environment', () => {
      const auth = solr.getSolrAuth();
      expect(auth).toBe('test:test');
    });

    it('should return undefined when not set', () => {
      delete process.env.SOLR_AUTH;
      const auth = solr.getSolrAuth();
      expect(auth).toBeUndefined();
      process.env.SOLR_AUTH = 'test:test';
    });
  });

  describe('querySOLR', () => {
    it('should return response object with docs', async () => {
      mockFetch.mockResolvedValue(makeSolrResponse(2, [
        { id: 'job1', url: 'https://panemar.ro/angajari/', title: 'Brutar', cif: '4844886' },
        { id: 'job2', url: 'https://panemar.ro/angajari/', title: 'Patiser', cif: '4844886' }
      ]));

      const result = await solr.querySOLR('4844886');

      expect(result).toHaveProperty('numFound', 2);
      expect(result).toHaveProperty('docs');
      expect(Array.isArray(result.docs)).toBe(true);
      expect(result.docs).toHaveLength(2);
    });

    it('should return empty docs when no jobs found', async () => {
      mockFetch.mockResolvedValue(makeSolrResponse(0, []));

      const result = await solr.querySOLR('00000000');

      expect(result.numFound).toBe(0);
      expect(result.docs).toEqual([]);
    });

    it('should throw when SOLR_AUTH is missing', async () => {
      delete process.env.SOLR_AUTH;
      await expect(solr.querySOLR('4844886')).rejects.toThrow('SOLR_AUTH not set in environment');
      process.env.SOLR_AUTH = 'test:test';
    });

    it('should throw on HTTP error', async () => {
      mockFetch.mockResolvedValue(makeErrorResponse(500, 'Internal Server Error'));

      await expect(solr.querySOLR('4844886')).rejects.toThrow('SOLR query error: 500');
    });
  });

  describe('queryCompanySOLR', () => {
    it('should return company data', async () => {
      mockFetch.mockResolvedValue(makeSolrResponse(1, [
        { id: '4844886', company: 'PANEMAR MORARIT SI PANIFICATIE SRL', brand: 'PANEMAR' }
      ]));

      const result = await solr.queryCompanySOLR('id:4844886');

      expect(result.numFound).toBe(1);
      expect(result.docs[0].brand).toBe('PANEMAR');
    });

    it('should return empty when company not found', async () => {
      mockFetch.mockResolvedValue(makeSolrResponse(0, []));

      const result = await solr.queryCompanySOLR('id:00000000');

      expect(result.numFound).toBe(0);
    });

    it('should throw on HTTP error', async () => {
      mockFetch.mockResolvedValue(makeErrorResponse(401, 'Unauthorized'));

      await expect(solr.queryCompanySOLR('id:4844886')).rejects.toThrow('SOLR company query error: 401');
    });
  });

  describe('upsertJobs', () => {
    it('should accept array of jobs', async () => {
      mockFetch.mockResolvedValue(makeSolrResponse(0, []));

      const testJob = {
        url: 'https://panemar.ro/angajari/',
        title: 'Brutar',
        company: 'PANEMAR MORARIT SI PANIFICATIE SRL',
        cif: '4844886',
        status: 'scraped'
      };

      await expect(solr.upsertJobs([testJob])).resolves.not.toThrow();
    });

    it('should throw on HTTP error', async () => {
      mockFetch.mockResolvedValue(makeErrorResponse(400, 'Bad Request'));

      await expect(solr.upsertJobs([{ url: 'https://test.com/bad' }])).rejects.toThrow('SOLR upsert error: 400');
    });

    it('should throw when SOLR_AUTH is missing', async () => {
      delete process.env.SOLR_AUTH;
      await expect(solr.upsertJobs([])).rejects.toThrow('SOLR_AUTH not set in environment');
      process.env.SOLR_AUTH = 'test:test';
    });
  });

  describe('deleteJobByUrl', () => {
    it('should delete a job by URL', async () => {
      mockFetch.mockResolvedValue(makeSolrResponse(0, []));

      await expect(solr.deleteJobByUrl('https://panemar.ro/angajari/')).resolves.not.toThrow();
    });

    it('should throw on HTTP error', async () => {
      mockFetch.mockResolvedValue(makeErrorResponse(500, 'Error'));

      await expect(solr.deleteJobByUrl('https://test.com/bad')).rejects.toThrow('SOLR delete error: 500');
    });
  });

  describe('deleteJobsByCIF', () => {
    it('should delete all jobs for a CIF', async () => {
      mockFetch.mockResolvedValue(makeSolrResponse(0, []));

      await expect(solr.deleteJobsByCIF('4844886')).resolves.not.toThrow();
    });

    it('should throw on HTTP error', async () => {
      mockFetch.mockResolvedValue(makeErrorResponse(500, 'Error'));

      await expect(solr.deleteJobsByCIF('4844886')).rejects.toThrow('SOLR delete error: 500');
    });
  });

  describe('Data Integrity', () => {
    it('should have unique titles for each job even when URLs are shared', async () => {
      mockFetch.mockResolvedValue(makeSolrResponse(2, [
        { url: 'https://panemar.ro/angajari/', title: 'Brutar', cif: '4844886' },
        { url: 'https://panemar.ro/angajari/', title: 'Patiser', cif: '4844886' }
      ]));

      const result = await solr.querySOLR('4844886');
      const titles = result.docs.map(j => j.title);
      const uniqueTitles = new Set(titles);

      expect(uniqueTitles.size).toBe(result.numFound);
    });

    it('should have valid status values', async () => {
      const validStatuses = ['scraped', 'tested', 'verified', 'published'];

      mockFetch.mockResolvedValue(makeSolrResponse(3, [
        { url: 'https://panemar.ro/angajari/', title: 'Brutar', cif: '4844886', status: 'scraped' },
        { url: 'https://panemar.ro/angajari/', title: 'Patiser', cif: '4844886', status: 'verified' },
        { url: 'https://panemar.ro/angajari/', title: 'Șofer', cif: '4844886', status: 'published' }
      ]));

      const result = await solr.querySOLR('4844886');

      for (const job of result.docs) {
        expect(validStatuses).toContain(job.status);
      }
    });
  });
});
