export const requiredRelationshipCreate = <U>(schema: U) => ({
  create: schema,
});

export const optionalRelationshipCreate = <U>(schema: U | undefined) =>
  schema
    ? {
        create: schema,
      }
    : undefined;

export const requiredRelationshipUpdate = <U>(schema: U) => ({
  update: schema,
});

export const optionalRelationshipUpdate = <U>(schema: U | undefined) =>
  schema
    ? {
        update: schema,
      }
    : undefined;

export const optionalRelationshipUpsert = <U>(schema: U | undefined) =>
  schema
    ? {
        upsert: {
          create: schema,
          update: schema,
        },
      }
    : undefined;
