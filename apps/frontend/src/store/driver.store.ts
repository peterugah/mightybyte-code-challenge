import type { DriverLoginDto } from "@monorepo/shared";
import { create } from "zustand"
import { driverClient } from "../clients/driver.client";
import type { requestState } from "../types/requestState";
import { persist } from "zustand/middleware";

interface DriverDetails {
  id?: number;
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
const store = create<DriverStore>()(
  persist(
    () => initialState,
    {
      name: "driver-store",
    }
  )
);


const setRequestState = (requestState: requestState) => {
  store.setState({ requestState })
}
const setDetails = (details: DriverDetails) => {
  store.setState({ details })
}
const reset = () => {
  store.setState(initialState)
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
  reset,
  login
}