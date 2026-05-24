export const environment = {
  production: false,
  serverUrl: 'https://user-mgt.smartstockflow.co.uk/User-Mgt/api',
  ReportUrl: 'http://127.0.0.1:8886/Reports/api',
  OrganizeUrl: 'http://127.0.0.1:8888/Organizations/api',
 InventoryUrl: 'https://api.smartstockflow.co.uk/DemandFlow-Service/api',
 forecasturl: 'https://forecast.smartstockflow.co.uk/api/v1/',
 FileManagementUrl: 'https://filemgt.smartstockflow.co.uk/File-Mgt/api/CreateFile',

  LogoLight: 'https://i.postimg.cc/B6R5Y6m6/Chat-GPT-Image-May-16-2026-10-01-48-PM-removebg-preview.png',
  LogoDark: 'https://i.postimg.cc/B6R5Y6m6/Chat-GPT-Image-May-16-2026-10-01-48-PM-removebg-preview.png',
  WORKSPACEID: 'WS680',
  auth0: {
    domain: 'smartstockflow.uk.auth0.com',
    clientId: 'CHLJIkepV27LPqcxe1FxWC4uHCwNi2Ol',
    authorizationParams: {
      // audience: 'https://h-pos.us.auth0.com/api/v2/',
      redirect_uri: 'http://localhost:4200/',
    },
  },
};
