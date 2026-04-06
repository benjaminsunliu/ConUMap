import {
  buildLoggedInDataFromCookieString,
  parseCookieString,
} from "@/utils/authCookies";

describe("authCookies", () => {
  it("parses cookie values that contain equals signs", () => {
    const cookies = parseCookieString("SSO-Token=token==; Given-Name=Ben; Surname=L");

    expect(cookies["SSO-Token"]).toBe("token==");
    expect(cookies["Given-Name"]).toBe("Ben");
    expect(cookies["Surname"]).toBe("L");
  });

  it("builds logged in data from the Concordia cookie string", () => {
    expect(
      buildLoggedInDataFromCookieString(
        "Given-Name=Ben; Surname=L; SSO-Token=token==",
      ),
    ).toEqual({
      authToken: "token==",
      firstName: "Ben",
      lastNameInitial: "L",
    });
  });
});
