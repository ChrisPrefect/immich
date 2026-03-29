import { Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { AlbumUserMetadataTable } from 'src/schema/tables/album-user-metadata.table';

export type AlbumUserMetadataId = {
  albumId: string;
  userId: string;
};

@Injectable()
export class AlbumUserMetadataRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [{ albumId: DummyValue.UUID, userId: DummyValue.UUID, isFavorite: true }] })
  async upsert(dto: Insertable<AlbumUserMetadataTable>) {
    await this.db
      .insertInto('album_user_metadata')
      .values(dto)
      .onConflict((oc) =>
        oc.columns(['albumId', 'userId']).doUpdateSet((eb) => ({ isFavorite: eb.ref('excluded.isFavorite') })),
      )
      .execute();
  }
}
