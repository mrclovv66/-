USE [ЖКХ_DB]
GO

CREATE OR ALTER TRIGGER trg_UpdateWaterValues
ON Показание_счётчиков
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Обновляем горячую воду только если поле изменилось
    IF UPDATE(Горячая_вода)
    BEGIN
        UPDATE du
        SET du.Сумма = i.Горячая_вода * 313
        FROM Данные_об_услуге du
        JOIN inserted i ON du.Номер_ЕПД = i.Номер_документа
        WHERE du.Наименование_услуги = 'Горячее водоснабжение';
    END

    -- Обновляем холодную воду только если поле изменилось
    IF UPDATE(Холодная_вода)
    BEGIN
        UPDATE du
        SET du.Сумма = i.Холодная_вода * 66
        FROM Данные_об_услуге du
        JOIN inserted i ON du.Номер_ЕПД = i.Номер_документа
        WHERE du.Наименование_услуги = 'Холодное водоснабжение';
    END
END;
GO

CREATE OR ALTER TRIGGER trg_RecalcEPDTotal
ON Данные_об_услуге
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH changed_docs AS (
        SELECT Номер_ЕПД FROM inserted
        UNION
        SELECT Номер_ЕПД FROM deleted
    )
    UPDATE e
    SET e.Сумма = ISNULL((
        SELECT SUM(du.Сумма)
        FROM Данные_об_услуге du
        WHERE du.Номер_ЕПД = e.Номер_документа
    ), 0)  -- если нет услуг, ставим 0
    FROM ЕПД e
    WHERE e.Номер_документа IN (SELECT Номер_ЕПД FROM changed_docs);
END;
GO
