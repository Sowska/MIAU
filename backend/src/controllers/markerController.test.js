'use strict';

/**
 * Unit tests for markerController — listMarkers, getMarker, createMarker handlers.
 */

const Marker = require('../models/Marker');
const { listMarkers, getMarker, createMarker, updateMarker, deleteMarker } = require('./markerController');

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

describe('markerController — listMarkers', () => {
  let findSpy;

  beforeEach(() => {
    findSpy = vi.spyOn(Marker, 'find');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 200 with array of non-deleted markers', async () => {
    const fakeMarkers = [{ title: 'Mural 1' }, { title: 'Mural 2' }];
    findSpy.mockResolvedValueOnce(fakeMarkers);

    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    await listMarkers(req, res, next);

    expect(findSpy).toHaveBeenCalledWith({ deletedAt: null });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakeMarkers);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next(err) on database error', async () => {
    const dbError = new Error('DB failed');
    findSpy.mockRejectedValueOnce(dbError);

    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    await listMarkers(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
  });
});

describe('markerController — getMarker', () => {
  let findOneSpy;

  beforeEach(() => {
    findOneSpy = vi.spyOn(Marker, 'findOne');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 200 with marker when found', async () => {
    const fakeMarker = { _id: 'marker1', title: 'Test Mural' };
    findOneSpy.mockResolvedValueOnce(fakeMarker);

    const req = createMockReq({ params: { id: 'marker1' } });
    const res = createMockRes();
    const next = vi.fn();

    await getMarker(req, res, next);

    expect(findOneSpy).toHaveBeenCalledWith({ _id: 'marker1', deletedAt: null });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakeMarker);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 404 when marker not found', async () => {
    findOneSpy.mockResolvedValueOnce(null);

    const req = createMockReq({ params: { id: 'nonexistent' } });
    const res = createMockRes();
    const next = vi.fn();

    await getMarker(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Marker not found' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next(err) on database error', async () => {
    const dbError = new Error('DB timeout');
    findOneSpy.mockRejectedValueOnce(dbError);

    const req = createMockReq({ params: { id: 'marker1' } });
    const res = createMockRes();
    const next = vi.fn();

    await getMarker(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
  });
});

describe('markerController — createMarker', () => {
  let createSpy;

  beforeEach(() => {
    createSpy = vi.spyOn(Marker, 'create');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 400 when title is missing', async () => {
    const req = createMockReq({
      body: { category: 'mural', longitude: '-3.7', latitude: '40.4' },
    });
    const res = createMockRes();
    const next = vi.fn();

    await createMarker(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Title is required' });
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('should return 400 when category is missing', async () => {
    const req = createMockReq({
      body: { title: 'My Mural', longitude: '-3.7', latitude: '40.4' },
    });
    const res = createMockRes();
    const next = vi.fn();

    await createMarker(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Category is required' });
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('should create marker and return 201 with marker document', async () => {
    const fakeMarker = {
      _id: 'marker789',
      title: 'Street Art',
      category: 'graffiti',
      description: 'Cool piece',
      author: 'Artist X',
      location: { type: 'Point', coordinates: [-3.7, 40.4] },
      owner: 'owner123',
    };
    createSpy.mockResolvedValueOnce(fakeMarker);

    const req = createMockReq({
      body: {
        title: 'Street Art',
        category: 'graffiti',
        description: 'Cool piece',
        author: 'Artist X',
        longitude: '-3.7',
        latitude: '40.4',
      },
    });
    const res = createMockRes();
    const next = vi.fn();

    await createMarker(req, res, next);

    expect(createSpy).toHaveBeenCalledWith({
      title: 'Street Art',
      category: 'graffiti',
      description: 'Cool piece',
      author: 'Artist X',
      location: { type: 'Point', coordinates: [-3.7, 40.4] },
      owner: 'owner123',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(fakeMarker);
    expect(next).not.toHaveBeenCalled();
  });

  it('should include imagePath when req.file is present', async () => {
    const fakeMarker = { _id: 'marker999', title: 'Mural', imagePath: 'uploads/abc.jpg' };
    createSpy.mockResolvedValueOnce(fakeMarker);

    const req = createMockReq({
      body: {
        title: 'Mural',
        category: 'mural',
        longitude: '2.1',
        latitude: '41.3',
      },
      file: { filename: 'abc.jpg' },
    });
    const res = createMockRes();
    const next = vi.fn();

    await createMarker(req, res, next);

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ imagePath: 'uploads/abc.jpg' })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should call next(err) on database error', async () => {
    const dbError = new Error('DB write failed');
    createSpy.mockRejectedValueOnce(dbError);

    const req = createMockReq({
      body: {
        title: 'Mural',
        category: 'mural',
        longitude: '0',
        latitude: '0',
      },
    });
    const res = createMockRes();
    const next = vi.fn();

    await createMarker(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
  });
});


describe('markerController — updateMarker', () => {
  let findOneSpy;

  beforeEach(() => {
    findOneSpy = vi.spyOn(Marker, 'findOne');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 404 when marker not found', async () => {
    findOneSpy.mockResolvedValueOnce(null);

    const req = createMockReq({ params: { id: 'nonexistent' }, body: { title: 'New' } });
    const res = createMockRes();
    const next = vi.fn();

    await updateMarker(req, res, next);

    expect(findOneSpy).toHaveBeenCalledWith({ _id: 'nonexistent', deletedAt: null });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Marker not found' });
  });

  it('should return 403 when user is not the owner', async () => {
    const fakeMarker = { _id: 'marker1', owner: { toString: () => 'otherUser456' } };
    findOneSpy.mockResolvedValueOnce(fakeMarker);

    const req = createMockReq({ params: { id: 'marker1' }, body: { title: 'Updated' } });
    const res = createMockRes();
    const next = vi.fn();

    await updateMarker(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authorized to edit this marker' });
  });

  it('should apply partial update and return 200 with updated marker', async () => {
    const fakeMarker = {
      _id: 'marker1',
      title: 'Old Title',
      category: 'mural',
      description: 'Old desc',
      author: 'Old Author',
      date: null,
      imagePath: null,
      owner: { toString: () => 'owner123' },
      save: vi.fn().mockResolvedValueOnce(undefined),
    };
    findOneSpy.mockResolvedValueOnce(fakeMarker);

    const req = createMockReq({
      params: { id: 'marker1' },
      body: { title: 'New Title', description: 'New desc' },
    });
    const res = createMockRes();
    const next = vi.fn();

    await updateMarker(req, res, next);

    expect(fakeMarker.title).toBe('New Title');
    expect(fakeMarker.description).toBe('New desc');
    // Unmodified fields stay the same
    expect(fakeMarker.category).toBe('mural');
    expect(fakeMarker.author).toBe('Old Author');
    expect(fakeMarker.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakeMarker);
    expect(next).not.toHaveBeenCalled();
  });

  it('should update imagePath when req.file is present', async () => {
    const fakeMarker = {
      _id: 'marker1',
      title: 'Title',
      imagePath: 'uploads/old.jpg',
      owner: { toString: () => 'owner123' },
      save: vi.fn().mockResolvedValueOnce(undefined),
    };
    findOneSpy.mockResolvedValueOnce(fakeMarker);

    const req = createMockReq({
      params: { id: 'marker1' },
      body: {},
      file: { filename: 'new-image.jpg' },
    });
    const res = createMockRes();
    const next = vi.fn();

    await updateMarker(req, res, next);

    expect(fakeMarker.imagePath).toBe('uploads/new-image.jpg');
    expect(fakeMarker.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should call next(err) on database error', async () => {
    const dbError = new Error('DB error');
    findOneSpy.mockRejectedValueOnce(dbError);

    const req = createMockReq({ params: { id: 'marker1' }, body: { title: 'X' } });
    const res = createMockRes();
    const next = vi.fn();

    await updateMarker(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
  });
});

describe('markerController — deleteMarker', () => {
  let findOneSpy;

  beforeEach(() => {
    findOneSpy = vi.spyOn(Marker, 'findOne');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 404 when marker not found', async () => {
    findOneSpy.mockResolvedValueOnce(null);

    const req = createMockReq({ params: { id: 'nonexistent' } });
    const res = createMockRes();
    const next = vi.fn();

    await deleteMarker(req, res, next);

    expect(findOneSpy).toHaveBeenCalledWith({ _id: 'nonexistent', deletedAt: null });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Marker not found' });
  });

  it('should return 403 when user is not the owner', async () => {
    const fakeMarker = { _id: 'marker1', owner: { toString: () => 'otherUser456' } };
    findOneSpy.mockResolvedValueOnce(fakeMarker);

    const req = createMockReq({ params: { id: 'marker1' } });
    const res = createMockRes();
    const next = vi.fn();

    await deleteMarker(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authorized to delete this marker' });
  });

  it('should soft-delete marker and return 200', async () => {
    const fakeMarker = {
      _id: 'marker1',
      owner: { toString: () => 'owner123' },
      deletedAt: null,
      save: vi.fn().mockResolvedValueOnce(undefined),
    };
    findOneSpy.mockResolvedValueOnce(fakeMarker);

    const req = createMockReq({ params: { id: 'marker1' } });
    const res = createMockRes();
    const next = vi.fn();

    await deleteMarker(req, res, next);

    expect(fakeMarker.deletedAt).toBeInstanceOf(Date);
    expect(fakeMarker.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Marker deleted' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next(err) on database error', async () => {
    const dbError = new Error('DB error');
    findOneSpy.mockRejectedValueOnce(dbError);

    const req = createMockReq({ params: { id: 'marker1' } });
    const res = createMockRes();
    const next = vi.fn();

    await deleteMarker(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
  });
});
