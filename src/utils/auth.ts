export const getPayloadJwt = async (headers: any, accessJwt: any) => {
  const authHeader = headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;

  const payload = await accessJwt.verify(token);
  return payload;
};
