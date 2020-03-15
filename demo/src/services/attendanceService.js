import http from "./httpService";

const apiEndPoint = "/attendance";
const ruleAPI = "/rule";
const ObjectId = "5e3d5fd277b32c493bf06789";
const profile = "/profile";

export async function attendance(barcodeId) {
  return await http.post(`${apiEndPoint}/${barcodeId}`);
}

export async function rule(sunday, monday, tuesday, wednesday, thursday) {
  return await http.put(`${ruleAPI}/${ObjectId}`, {
    sunday,
    monday,
    tuesday,
    wednesday,
    thursday
  });
}

export async function getRuleData() {
  return http.get(`${ruleAPI}/${ObjectId}`);
}

export async function userAttendance(id) {
  return await http.get(`${profile}/${id}`);
}
export async function presentDays() {
  return await http.get(`/present-days`);
}
export default {
  attendance,
  rule,
  getRuleData,
  userAttendance,
  presentDays
};
