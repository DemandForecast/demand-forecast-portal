export const environment = {
  production: false,
  serverUrl: 'http://127.0.0.1:8080/User-Mgt/api',
  ReportUrl: 'http://127.0.0.1:8886/Reports/api',
  OrganizeUrl: 'http://127.0.0.1:8888/Organizations/api',
 InventoryUrl: 'http://127.0.0.1:8888/DemandFlow-Service/api',

  LogoLight: '',
  LogoDark: 'https://i.postimg.cc/9f5qsBh6/images.jpg',
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
