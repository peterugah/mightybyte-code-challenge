
import axios from "axios"
import type { DriverLoginDto, DriverLoginResponse, Driver } from "@monorepo/shared"
const login = async (payload: DriverLoginDto) => {
  const response = await axios<DriverLoginResponse>({
    url: `${import.meta.env.VITE_BASE_URL}/login`,
    data: payload,
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  })
  return response.data;
}

const getAll = async () => {
  const response = await axios<Driver[]>({
    url: `${import.meta.env.VITE_BASE_URL}/driver`,
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  })
  return response.data
}

export const driverClient = {
  login,
  getAll
}