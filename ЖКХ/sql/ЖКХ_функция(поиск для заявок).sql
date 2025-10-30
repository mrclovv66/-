-- ================================================
-- Template generated from Template Explorer using:
-- Create Inline Function (New Menu).SQL
--
-- Use the Specify Values for Template Parameters 
-- command (Ctrl-Shift-M) to fill in the parameter 
-- values below.
--
-- This block of comments will not be included in
-- the definition of the function.
-- ================================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- =============================================
--поиск по дате работает только по такому формату: yyyy-mm-dd
--CREATE OR ALTER FUNCTION dbo.SearchRequests (@search VARCHAR(100))
--RETURNS TABLE 
--AS
--RETURN
--(
--    SELECT 
--        z.ID_заявки,
--        z.ID_клиента,
--        k.ФИО AS ФИО_клиента,
--        z.Адрес_квартиры,
--        z.Тип_заявки,
--        z.Описание,
--        z.Дата_создания,
--        z.Статус
--    FROM Заявки AS z
--    JOIN Клиент AS k ON z.ID_клиента = k.Id_клиента
--    WHERE 
--        k.ФИО LIKE '%' + @search + '%'
--        OR z.Адрес_квартиры LIKE '%' + @search + '%'
--        OR z.Тип_заявки LIKE '%' + @search + '%'
--        OR z.Описание LIKE '%' + @search + '%'
--        OR z.Статус LIKE '%' + @search + '%'
--        OR CAST(z.ID_заявки AS VARCHAR(20)) LIKE '%' + @search + '%'
--        OR CAST(z.Дата_создания AS VARCHAR(20)) LIKE '%' + @search + '%'
--);
--GO



CREATE OR ALTER FUNCTION dbo.SearchRequests (@search NVARCHAR(100))
RETURNS TABLE 
AS
RETURN
(
    SELECT 
        z.ID_заявки,
        z.ID_клиента,
        k.ФИО AS ФИО_клиента,
        z.Адрес_квартиры,
        z.Тип_заявки,
        z.Описание,
        z.Дата_создания,
        z.Статус
    FROM Заявки AS z
    JOIN Клиент AS k ON z.ID_клиента = k.Id_клиента
    WHERE
        -- Ищем в любом столбце, независимо от типа
        k.ФИО                LIKE '%' + @search + '%'
        OR z.Адрес_квартиры  LIKE '%' + @search + '%'
        OR z.Тип_заявки      LIKE '%' + @search + '%'
        OR z.Описание        LIKE '%' + @search + '%'
        OR z.Статус          LIKE '%' + @search + '%'
        OR CAST(z.ID_заявки AS VARCHAR(20)) LIKE '%' + @search + '%'
        OR CAST(z.ID_клиента AS VARCHAR(20)) LIKE '%' + @search + '%'
        OR CAST(z.Дата_создания AS VARCHAR(20)) LIKE '%' + @search + '%'
        OR CAST(DAY(z.Дата_создания) AS VARCHAR(2)) LIKE '%' + @search + '%'
        OR CAST(MONTH(z.Дата_создания) AS VARCHAR(2)) LIKE '%' + @search + '%'
        OR CAST(YEAR(z.Дата_создания) AS VARCHAR(4)) LIKE '%' + @search + '%'
);
GO


--CREATE OR ALTER FUNCTION dbo.SearchRequests (@search NVARCHAR(100))
--RETURNS TABLE
--AS
--RETURN
--(
--    WITH S AS (
--        SELECT
--            TRIM(@search)                         AS Srch,
--            -- признаки ввода
--            CASE WHEN @search NOT LIKE '%[^0-9]%' THEN 1 ELSE 0 END AS IsNumeric,
--            LEN(@search)                           AS L
--    ),
--    Data AS (
--        SELECT
--            z.ID_заявки,
--            z.ID_клиента,
--            k.ФИО AS ФИО_клиента,
--            z.Адрес_квартиры,
--            z.Тип_заявки,
--            z.Описание,
--            z.Дата_создания,
--            z.Статус,

--            -- ISO: YYYY-MM-DD (CAST)
--            CAST(z.Дата_создания AS VARCHAR(10)) AS ISO_yyyy_mm_dd,
--            -- RU: DD.MM.YYYY (CAST)
--            RIGHT('00' + CAST(DAY(z.Дата_создания)   AS VARCHAR(2)), 2) + '.' +
--            RIGHT('00' + CAST(MONTH(z.Дата_создания) AS VARCHAR(2)), 2) + '.' +
--            CAST(YEAR(z.Дата_создания)               AS VARCHAR(4))   AS RU_dd_mm_yyyy,
--            -- компоненты
--            RIGHT('00' + CAST(DAY(z.Дата_создания)   AS VARCHAR(2)), 2) AS Day2,
--            RIGHT('00' + CAST(MONTH(z.Дата_создания) AS VARCHAR(2)), 2) AS Month2,
--            CAST(YEAR(z.Дата_создания)               AS VARCHAR(4))     AS Year4
--        FROM Заявки z
--        JOIN Клиент k ON z.ID_клиента = k.Id_клиента
--    )
--    SELECT
--        ID_заявки, ID_клиента, ФИО_клиента, Адрес_квартиры,
--        Тип_заявки, Описание, Дата_создания, Статус
--    FROM Data
--    CROSS JOIN S
--    WHERE
--        -- 1) Если ввод содержит БУКВЫ/символы — общий текстовый поиск
--        (
--            S.IsNumeric = 0
--            AND (
--                ФИО_клиента     LIKE '%' + S.Srch + '%'
--                OR Адрес_квартиры LIKE '%' + S.Srch + '%'
--                OR Тип_заявки     LIKE '%' + S.Srch + '%'
--                OR Описание       LIKE '%' + S.Srch + '%'
--                OR Статус         LIKE '%' + S.Srch + '%'
--                OR ISO_yyyy_mm_dd LIKE '%' + REPLACE(REPLACE(S.Srch, '.', '-'), '/', '-') + '%'
--                OR RU_dd_mm_yyyy  LIKE '%' + S.Srch + '%'
--            )
--        )

--        -- 2) Если ввод ТОЛЬКО ЦИФРЫ — «умный» режим без адресов/текстов
--        OR (
--            S.IsNumeric = 1 AND (
--                -- 2.1) Год YYYY
--                (S.L = 4 AND Year4 = S.Srch)

--                -- 2.2) Месяц MM (1–12)
--                OR (S.L = 2 AND TRY_CAST(S.Srch AS INT) BETWEEN 1 AND 12
--                    AND Month2 = RIGHT('00' + S.Srch, 2))

--                -- 2.3) День DD (13–31) — используем остаток диапазона
--                OR (S.L = 2 AND TRY_CAST(S.Srch AS INT) BETWEEN 13 AND 31
--                    AND Day2 = RIGHT('00' + S.Srch, 2))

--                -- 2.4) ID заявки — строгое совпадение (чтобы '15' не триггерил адрес)
--                OR (CAST(ID_заявки AS VARCHAR(20)) = S.Srch)
--            )
--        )

--        -- 3) Явные шаблоны дат как строки (dd.mm.yyyy / mm.yyyy / yyyy-mm-dd)
--        OR (
--            -- dd.mm.yyyy
--            S.L = 10 AND SUBSTRING(S.Srch,3,1)='.' AND SUBSTRING(S.Srch,6,1)='.'
--            AND RU_dd_mm_yyyy = S.Srch
--        )
--        OR (
--            -- mm.yyyy
--            S.L = 7 AND SUBSTRING(S.Srch,3,1)='.'
--            AND Month2 = LEFT(S.Srch,2) AND Year4 = RIGHT(S.Srch,4)
--        )
--        OR (
--            -- yyyy-mm-dd
--            S.L = 10 AND SUBSTRING(S.Srch,5,1)='-' AND SUBSTRING(S.Srch,8,1)='-'
--            AND ISO_yyyy_mm_dd = S.Srch
--        )
--);
--GO
