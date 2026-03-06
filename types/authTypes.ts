export type AuthContextData = LoggedInContext | LoggedOutContext;

export type LoggedInContext = {
  isLoggedIn: true;
  readonly data: LoggedInData;
  logout: () => Promise<void>;
};

export type LoggedOutContext = {
  isLoggedIn: false;
  data: null;
  login: (data: LoggedInData) => Promise<void>;
};

export type LoggedInData = {
  firstName: string;
  lastNameInitial: string;
  authToken: string;
};
