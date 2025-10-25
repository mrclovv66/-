import api from "./api";

export async function login(phone: string, password: string) {
  const res = await api.post("/login", { username: phone, password });
  return res.data;
}
