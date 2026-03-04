export type AuthContextData = LoggedInContext | LoggedOutContext;

export type LoggedInContext = {
  isLoggedIn: true;
  data: LoggedInData;
  logout: () => void;
};

export type LoggedOutContext = {
  isLoggedIn: false;
  data: null;
  login: (data: LoggedInData) => void;
};

export type LoggedInData = {
  firstName: string;
  lastNameInitial: string;
  authToken: string;
};
