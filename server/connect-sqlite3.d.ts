declare module 'connect-sqlite3' {
  import session from 'express-session';
  function connectSqlite3(session: any): any;
  export = connectSqlite3;
}
