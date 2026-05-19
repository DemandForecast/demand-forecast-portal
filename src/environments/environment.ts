export const environment = {
  production: false,
  serverUrl: 'http://127.0.0.1:8080/User-Mgt/api',
  ReportUrl: 'http://127.0.0.1:8886/Reports/api',
  OrganizeUrl: 'http://127.0.0.1:8888/Organizations/api',
 InventoryUrl: 'http://127.0.0.1:8888/DemandFlow-Service/api',

  LogoLight: 'https://i.postimg.cc/B6R5Y6m6/Chat-GPT-Image-May-16-2026-10-01-48-PM-removebg-preview.png',
  LogoDark: 'https://i.postimg.cc/B6R5Y6m6/Chat-GPT-Image-May-16-2026-10-01-48-PM-removebg-preview.png',
  WORKSPACEID: 'WS680',
  auth0: {
    domain: 'dev-yi2vtudtt52q3bgx.us.auth0.com',
    clientId: '56bSrJyNAAcsE7Hfs88lBH3BEXYesuwA',
    authorizationParams: {
      // audience: 'https://h-pos.us.auth0.com/api/v2/',
      redirect_uri: 'http://localhost:4200/',
    },
  },
};
