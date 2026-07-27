'use strict';

/**
 * Property test for contributionController — listContributions access control.
 *
 * **Validates: Requirements 9.7, 9.8, 9.9**
 *
 * Property 22: Contributions access control
 * For any Marker and any authenticated User who is not the Owner of that Marker,
 * GET /markers/:id/contributions SHALL return HTTP 403.
 * For the Owner, it SHALL return the contributions list with each entry's note and createdAt timestamp.
 */

const Marker = require('../models/Marker');
const Contribution = require('../models/Contribution');
const { listContributions, createContribution } = require('./contributionController');

function createMockReq(overrides = {}) {
  return {
    body: {},
    params: {},
    user: { userId: 'owner123' },
    ...overrides,
  };
}

function createMockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('contributionController — listContributions access control (Property 22)', () => {
  let findOneSpy;
  let findSpy;

  beforeEach(() => {
    findOneSpy = vi.spyOn(Marker, 'findOne');
    findSpy = vi.spyOn(Contribution, 'find');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 404 when marker does not exist', async () => {
    findOneSpy.mockResolvedValueOnce(null);

    const req = createMockReq({ params: { id: 'nonexistent' } });
    const res = createMockRes();
    const next = vi.fn();

    await listContributions(req, res, next);

    expect(findOneSpy).toHaveBeenCalledWith({ _id: 'nonexistent', deletedAt: null });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Marker not found' });
    expect(findSpy).not.toHaveBeenCalled();
  });

  it('should return 403 when authenticated user is not the marker owner', async () => {
    const fakeMarker = {
      _id: 'marker1',
      owner: { toString: () => 'ownerABC' },
    };
    findOneSpy.mockResolvedValueOnce(fakeMarker);

    const req = createMockReq({
      params: { id: 'marker1' },
      user: { userId: 'nonOwnerXYZ' },
    });
    const res = createMockRes();
    const next = vi.fn();

    await listContributions(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authorized to view contributions' });
    expect(findSpy).not.toHaveBeenCalled();
  });

  it('should return 403 for multiple different non-owner user IDs (property-like)', async () => {
    const ownerId = 'realOwner999';
    const nonOwnerIds = ['userA', 'userB', 'userC', 'user123', 'anotherUser'];

    for (const nonOwnerId of nonOwnerIds) {
      findOneSpy.mockResolvedValueOnce({
        _id: 'marker42',
        owner: { toString: () => ownerId },
      });

      const req = createMockReq({
        params: { id: 'marker42' },
        user: { userId: nonOwnerId },
      });
      const res = createMockRes();
      const next = vi.fn();

      await listContributions(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not authorized to view contributions' });
      expect(findSpy).not.toHaveBeenCalled();
    }
  });

  it('should return 200 with contributions list when called by the marker owner', async () => {
    const ownerId = 'owner123';
    const fakeMarker = {
      _id: 'marker1',
      owner: { toString: () => ownerId },
    };
    const fakeContributions = [
      { _id: 'c1', note: 'Great mural!', marker: 'marker1', author: 'userA', createdAt: new Date('2024-01-15') },
      { _id: 'c2', note: 'Needs restoration', marker: 'marker1', author: 'userB', createdAt: new Date('2024-02-20') },
    ];

    findOneSpy.mockResolvedValueOnce(fakeMarker);
    findSpy.mockResolvedValueOnce(fakeContributions);

    const req = createMockReq({
      params: { id: 'marker1' },
      user: { userId: ownerId },
    });
    const res = createMockRes();
    const next = vi.fn();

    await listContributions(req, res, next);

    expect(findOneSpy).toHaveBeenCalledWith({ _id: 'marker1', deletedAt: null });
    expect(findSpy).toHaveBeenCalledWith({ marker: 'marker1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakeContributions);

    // Verify each contribution has note and createdAt
    const returnedContributions = res.json.mock.calls[0][0];
    for (const contribution of returnedContributions) {
      expect(contribution).toHaveProperty('note');
      expect(contribution).toHaveProperty('createdAt');
      expect(contribution.note).toBeTruthy();
      expect(contribution.createdAt).toBeInstanceOf(Date);
    }

    expect(next).not.toHaveBeenCalled();
  });

  it('should return 200 with empty array when owner has no contributions', async () => {
    const ownerId = 'ownerEmpty';
    const fakeMarker = {
      _id: 'marker5',
      owner: { toString: () => ownerId },
    };

    findOneSpy.mockResolvedValueOnce(fakeMarker);
    findSpy.mockResolvedValueOnce([]);

    const req = createMockReq({
      params: { id: 'marker5' },
      user: { userId: ownerId },
    });
    const res = createMockRes();
    const next = vi.fn();

    await listContributions(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next(err) on database error', async () => {
    const dbError = new Error('DB connection lost');
    findOneSpy.mockRejectedValueOnce(dbError);

    const req = createMockReq({ params: { id: 'marker1' } });
    const res = createMockRes();
    const next = vi.fn();

    await listContributions(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
  });
});

describe('contributionController — Property 21: Empty note rejection', () => {
  let createSpy;

  beforeEach(() => {
    createSpy = vi.spyOn(Contribution, 'create');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property-like test: iterate over a variety of invalid note values (empty,
   * whitespace-only, undefined, null, missing) and verify the controller
   * returns HTTP 400 with an error message and does NOT call Contribution.create.
   *
   * **Validates: Requirements 9.5**
   */
  const invalidNoteValues = [
    { label: 'empty string', body: { note: '' } },
    { label: 'spaces only', body: { note: '   ' } },
    { label: 'tab character', body: { note: '\t' } },
    { label: 'newline character', body: { note: '\n' } },
    { label: 'mixed whitespace', body: { note: '  \t  \n  ' } },
    { label: 'undefined note', body: { note: undefined } },
    { label: 'null note', body: { note: null } },
    { label: 'missing note field', body: {} },
  ];

  invalidNoteValues.forEach(({ label, body }) => {
    it(`should return 400 with error when note is: ${label}`, async () => {
      const req = createMockReq({ body, params: { id: 'marker123' } });
      const res = createMockRes();
      const next = vi.fn();

      await createContribution(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Note is required' });
      expect(createSpy).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });
});
