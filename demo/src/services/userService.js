import http from "./httpService";
const apiEndpoint = "/addUser";
const usersEndPoint='/all-user'
const Endpoint='/user'

function userUrl(id) {
  return `${Endpoint}/${id}`;
}

export function getAllUser(){
  return http.get(usersEndPoint)
}

export function deleteMovie(userId) {
  return http.delete(userUrl(userId));
}

export function getUser(userId) {
  return http.get(userUrl(userId));
}
export function saveUser(user) {
  if (user._id) {
    const body = {
      ...user
    };
    delete body._id;
    return http.put(userUrl(user._id), body);
  }

  return http.post(apiEndpoint, user);
}
export default{
  getAllUser
}