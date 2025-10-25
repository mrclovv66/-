package main

import (
	"database/sql"
	"fmt"

	_ "github.com/microsoft/go-mssqldb"
)

var db *sql.DB

func InitDB() {
	var err error
	connString := "server=localhost;trusted_connection=yes;database=ЖКХ_DB;encrypt=disable"
	db, err = sql.Open("sqlserver", connString)
	if err != nil {
		panic(err)
	}

	if err = db.Ping(); err != nil {
		panic(err)
	}

	fmt.Println("✅ Подключено к SQL Server")
}
