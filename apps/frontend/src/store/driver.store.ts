import type { DriverLoginDto } from "@monorepo/shared";
import { create } from "zustand"
import { driverClient } from "../clients/driver.client";
import type { requestState } from "../types/requestState";

interface DriverDetails {
  id?: string;
  firstName?: string;
  lastName?: string;
  image?: string;
  token?: string;
  refreshToken?: string;
}
interface DriverStore {
  requestState: requestState;
  details?: DriverDetails;
}

const initialState: DriverStore = {
  requestState: 'idle'
}
const store = create(() => initialState)

const setRequestState = (requestState: requestState) => {
  store.setState({ requestState })
}
const setDetails = (details: DriverDetails) => {
  store.setState({ details })
}

const login = async (payload: DriverLoginDto) => {
  try {
    setRequestState("loading")
    const { driver, token, refreshToken } = await driverClient.login(payload)
    setDetails({ ...driver, token, refreshToken })
    setRequestState("idle")
  } catch {
    setRequestState("error")
  }
}

export const driverStore = {
  store,
  login
}