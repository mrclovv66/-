USE [ЖКХ_DB]
GO
-- Очистка БД перед созданием (если таблицы уже есть)
DROP TABLE IF EXISTS Данные_об_услуге;
DROP TABLE IF EXISTS Показание_счётчиков;
DROP TABLE IF EXISTS ЕПД;
DROP TABLE IF EXISTS Задолженность;
DROP TABLE IF EXISTS Заявки;
DROP TABLE IF EXISTS Квартира;
DROP TABLE IF EXISTS Услуга;
DROP TABLE IF EXISTS Клиент;
GO

-------------------------------------------------
-- 1. Клиент
-------------------------------------------------
CREATE TABLE Клиент
(
    Id_клиента INT PRIMARY KEY IDENTITY(1,1),
    ФИО VARCHAR(50) NOT NULL,
    Номер_телефона VARCHAR(15) UNIQUE,
    Пароль VARCHAR(50) NOT NULL,
    Роль VARCHAR(20) NOT NULL CHECK (Роль IN ('admin','employee','client'))
);
GO

-------------------------------------------------
-- 2. Квартира
-------------------------------------------------
CREATE TABLE Квартира
(
    Адрес VARCHAR(50) PRIMARY KEY NOT NULL,
    Id_владельца INT NOT NULL REFERENCES Клиент(Id_клиента),
    Количество_комнат INT NOT NULL DEFAULT(1) CHECK (Количество_комнат >= 1),
    Площадь INT NOT NULL DEFAULT(10) CHECK (Площадь >= 10)
);
GO

-------------------------------------------------
-- 3. ЕПД (с флагом оплаты)
-------------------------------------------------
CREATE TABLE ЕПД
(
    Номер_документа VARCHAR(50) NOT NULL PRIMARY KEY,
    Адрес VARCHAR(50) NOT NULL REFERENCES Квартира(Адрес),
    Расчётный_месяц DATE NOT NULL,
    Сумма INT NOT NULL CHECK(Сумма > 0),
    Оплачен BIT  -- 0 = не оплачено, 1 = оплачено
);
GO

-------------------------------------------------
-- 4. Показание счётчиков
-------------------------------------------------
CREATE TABLE Показание_счётчиков
(
    Номер INT IDENTITY(1,1) PRIMARY KEY,
    Номер_документа VARCHAR(50) NOT NULL REFERENCES ЕПД(Номер_документа),
    Адрес VARCHAR(50) NOT NULL REFERENCES Квартира(Адрес),
    Расчётный_месяц DATE NOT NULL,
    Горячая_вода INT NOT NULL CHECK (Горячая_вода > 0),
    Холодная_вода INT NOT NULL CHECK(Холодная_вода > 0)
);
GO

-------------------------------------------------
-- 5. Услуга
-------------------------------------------------
CREATE TABLE Услуга
(
    Наименование VARCHAR(50) NOT NULL PRIMARY KEY,
    Категория VARCHAR(50) NOT NULL,
    Стоимость INT NOT NULL DEFAULT(100) CHECK(Стоимость > 0)
);
GO

-------------------------------------------------
-- 6. Данные об услуге
-------------------------------------------------
CREATE TABLE Данные_об_услуге
(
    Наименование_услуги VARCHAR(50) NOT NULL REFERENCES Услуга(Наименование),
    Номер_ЕПД VARCHAR(50) NOT NULL REFERENCES ЕПД(Номер_документа),
    Сумма INT NOT NULL DEFAULT(100) CHECK(Сумма > 0),
    PRIMARY KEY(Наименование_услуги, Номер_ЕПД)
);
GO
-------------------------------------------------
-- 7. Задолженность
-------------------------------------------------
CREATE TABLE Задолженность
(
    Номер INT PRIMARY KEY,
    Адрес VARCHAR(50) REFERENCES Квартира(Адрес),
    Сумма INT DEFAULT(100) CHECK(Сумма > 0),
    Срок_выплаты DATE
);
GO



-------------------------------------------------
--Новые таблицы
-------------------------------------------------

-------------------------------------------------
-- 8. заявки
-------------------------------------------------

CREATE TABLE Заявки (
    ID_заявки INT IDENTITY(1,1) PRIMARY KEY,
    ID_клиента INT NOT NULL REFERENCES Клиент(Id_клиента),
    Адрес_квартиры VARCHAR(50) NOT NULL REFERENCES Квартира(Адрес),
    Тип_заявки VARCHAR(50) NOT NULL, -- 'ремонт', 'консультация', 'жалоба'
    Описание TEXT NOT NULL,
    Дата_создания DATE NOT NULL,
    Статус VARCHAR(20) DEFAULT 'новая' CHECK (Статус IN ('новая', 'в работе', 'выполнена', 'отклонена'))
);