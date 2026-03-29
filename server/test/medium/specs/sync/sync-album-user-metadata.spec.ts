import { Kysely } from 'kysely';
import { SyncEntityType, SyncRequestType } from 'src/enum';
import { AlbumUserMetadataRepository } from 'src/repositories/album-user-metadata.repository';
import { AlbumUserRepository } from 'src/repositories/album-user.repository';
import { DB } from 'src/schema';
import { SyncTestContext } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = async (db?: Kysely<DB>) => {
  const ctx = new SyncTestContext(db || defaultDatabase);
  const { auth, user, session } = await ctx.newSyncAuthUser();
  return { auth, user, session, ctx };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(SyncEntityType.AlbumUserMetadataV1, () => {
  it('should sync owner album metadata rows', async () => {
    const { auth, ctx } = await setup();
    const { album } = await ctx.newAlbum({ ownerId: auth.user.id });

    const response = await ctx.syncStream(auth, [SyncRequestType.AlbumUserMetadataV1]);
    expect(response).toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album.id,
          userId: auth.user.id,
          isFavorite: false,
        },
        type: SyncEntityType.AlbumUserMetadataV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });

  it('should sync favorite updates', async () => {
    const { auth, ctx } = await setup();
    const repo = ctx.get(AlbumUserMetadataRepository);
    const { album } = await ctx.newAlbum({ ownerId: auth.user.id });

    const initial = await ctx.syncStream(auth, [SyncRequestType.AlbumUserMetadataV1]);
    await ctx.syncAckAll(auth, initial);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumUserMetadataV1]);

    await repo.upsert({ albumId: album.id, userId: auth.user.id, isFavorite: true });

    const updated = await ctx.syncStream(auth, [SyncRequestType.AlbumUserMetadataV1]);
    expect(updated).toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album.id,
          userId: auth.user.id,
          isFavorite: true,
        },
        type: SyncEntityType.AlbumUserMetadataV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });
});

describe(SyncEntityType.AlbumUserMetadataDeleteV1, () => {
  it('should sync metadata deletes when shared album access is removed', async () => {
    const { auth, ctx } = await setup();
    const albumUserRepo = ctx.get(AlbumUserRepository);
    const { user: owner } = await ctx.newUser();
    const { album } = await ctx.newAlbum({ ownerId: owner.id });
    await albumUserRepo.create({ albumId: album.id, userId: auth.user.id });

    const initial = await ctx.syncStream(auth, [SyncRequestType.AlbumUserMetadataV1]);
    await ctx.syncAckAll(auth, initial);
    await ctx.assertSyncIsComplete(auth, [SyncRequestType.AlbumUserMetadataV1]);

    await albumUserRepo.delete({ albumId: album.id, userId: auth.user.id });

    const deleted = await ctx.syncStream(auth, [SyncRequestType.AlbumUserMetadataV1]);
    expect(deleted).toEqual([
      {
        ack: expect.any(String),
        data: {
          albumId: album.id,
          userId: auth.user.id,
        },
        type: SyncEntityType.AlbumUserMetadataDeleteV1,
      },
      expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
    ]);
  });
});
