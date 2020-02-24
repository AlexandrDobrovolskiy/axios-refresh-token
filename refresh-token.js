let isRefreshing = false;
let refreshSubscribers = [];

// Axios instance
axios.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    const {
      config: originalRequest,
      response: { status },
    } = error;

    if (status === StatusCodes.UNAUTHORIZED) {
      if (!isRefreshing) {
        isRefreshing = true;

        requestRefreshToken().then(({ data }) => {
          isRefreshing = false;
          Keychain.setCredentials(data).then(() => {
            onRrefreshed(`${data.token_type} ${data.access_token}`);
          });
        });
      }

      return new Promise(resolve => {
        subscribeTokenRefresh(token => {
          originalRequest.headers.Authorization = token;
          resolve(axios(originalRequest));
        });
      });
    } else {
      return Promise.reject(error);
    }
  },
);

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRrefreshed(token) {
  refreshSubscribers.map(cb => cb(token));
}
