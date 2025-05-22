
import axios from "axios"
import type { DriverLoginDto, DriverLoginResponse } from "@monorepo/shared"
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

export const driverClient = {
  login
}