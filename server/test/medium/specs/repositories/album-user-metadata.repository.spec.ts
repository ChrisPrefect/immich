import { Kysely } from 'kysely';
import { AlbumUserMetadataRepository } from 'src/repositories/album-user-metadata.repository';
import { AlbumUserRepository } from 'src/repositories/album-user.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });

  return {
    ctx,
    sut: ctx.get(AlbumUserMetadataRepository),
    albumUserRepo: ctx.get(AlbumUserRepository),
  };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(AlbumUserMetadataRepository.name, () => {
  it('should create an owner metadata row when an album is created', async () => {
    const { ctx } = setup();
    const { user } = await ctx.newUser();
    const { album } = await ctx.newAlbum({ ownerId: user.id });

    await expect(
      ctx.database
        .selectFrom('album_user_metadata')
        .select(['albumId', 'userId', 'isFavorite'])
        .where('albumId', '=', album.id)
        .where('userId', '=', user.id)
        .executeTakeFirstOrThrow(),
    ).resolves.toEqual({
      albumId: album.id,
      userId: user.id,
      isFavorite: false,
    });
  });

  it('should create a shared-user metadata row when an album user is added', async () => {
    const { ctx, albumUserRepo } = setup();
    const { user: owner } = await ctx.newUser();
    const { user: sharedUser } = await ctx.newUser();
    const { album } = await ctx.newAlbum({ ownerId: owner.id });

    await albumUserRepo.create({ albumId: album.id, userId: sharedUser.id });

    await expect(
      ctx.database
        .selectFrom('album_user_metadata')
        .select(['albumId', 'userId', 'isFavorite'])
        .where('albumId', '=', album.id)
        .where('userId', '=', sharedUser.id)
        .executeTakeFirstOrThrow(),
    ).resolves.toEqual({
      albumId: album.id,
      userId: sharedUser.id,
      isFavorite: false,
    });
  });

  it('should delete metadata and write an audit row when album access is removed', async () => {
    const { ctx, albumUserRepo, sut } = setup();
    const { user: owner } = await ctx.newUser();
    const { user: sharedUser } = await ctx.newUser();
    const { album } = await ctx.newAlbum({ ownerId: owner.id });

    await albumUserRepo.create({ albumId: album.id, userId: sharedUser.id });
    await sut.upsert({ albumId: album.id, userId: sharedUser.id, isFavorite: true });

    await albumUserRepo.delete({ albumId: album.id, userId: sharedUser.id });

    await expect(
      ctx.database
        .selectFrom('album_user_metadata')
        .select('albumId')
        .where('albumId', '=', album.id)
        .where('userId', '=', sharedUser.id)
        .executeTakeFirst(),
    ).resolves.toBeUndefined();

    await expect(
      ctx.database
        .selectFrom('album_user_metadata_audit')
        .select(['albumId', 'userId'])
        .where('albumId', '=', album.id)
        .where('userId', '=', sharedUser.id)
        .executeTakeFirstOrThrow(),
    ).resolves.toEqual({
      albumId: album.id,
      userId: sharedUser.id,
    });
  });
});
