-- Crear tabla TblDisciplina
CREATE TABLE IF NOT EXISTS TblDisciplina (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear Stored Procedure para insertar disciplina
DELIMITER //

CREATE PROCEDURE sp_InsertarDisciplina(
    IN p_nombre VARCHAR(100),
    OUT p_id INT,
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_mensaje = 'Error al insertar la disciplina';
        SET p_id = 0;
    END;

    -- Validar que el nombre no esté vacío
    IF p_nombre IS NULL OR p_nombre = '' THEN
        SET p_mensaje = 'El nombre de la disciplina es requerido';
        SET p_id = 0;
    ELSE
        -- Insertar la disciplina
        INSERT INTO TblDisciplina (nombre) VALUES (p_nombre);
        
        -- Obtener el ID insertado
        SET p_id = LAST_INSERT_ID();
        SET p_mensaje = 'Disciplina creada correctamente';
    END IF;
END //

DELIMITER ;

-- Crear Stored Procedure para obtener todas las disciplinas
DELIMITER //

CREATE PROCEDURE sp_ObtenerDisciplinas()
BEGIN
    SELECT id, nombre, activa, fecha_creacion, fecha_actualizacion
    FROM TblDisciplina
    WHERE activa = TRUE
    ORDER BY nombre ASC;
END //

DELIMITER ;

-- Crear Stored Procedure para obtener disciplina por ID
DELIMITER //

CREATE PROCEDURE sp_ObtenerDisciplinaById(
    IN p_id INT
)
BEGIN
    SELECT id, nombre, activa, fecha_creacion, fecha_actualizacion
    FROM TblDisciplina
    WHERE id = p_id AND activa = TRUE;
END //

DELIMITER ;

-- Crear Stored Procedure para actualizar disciplina
DELIMITER //

CREATE PROCEDURE sp_ActualizarDisciplina(
    IN p_id INT,
    IN p_nombre VARCHAR(100),
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_mensaje = 'Error al actualizar la disciplina';
    END;

    IF p_nombre IS NULL OR p_nombre = '' THEN
        SET p_mensaje = 'El nombre de la disciplina es requerido';
    ELSE
        UPDATE TblDisciplina
        SET nombre = p_nombre
        WHERE id = p_id;
        
        SET p_mensaje = 'Disciplina actualizada correctamente';
    END IF;
END //

DELIMITER ;

-- Crear Stored Procedure para eliminar disciplina (desactivar)
DELIMITER //

CREATE PROCEDURE sp_EliminarDisciplina(
    IN p_id INT,
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_mensaje = 'Error al eliminar la disciplina';
    END;

    UPDATE TblDisciplina
    SET activa = FALSE
    WHERE id = p_id;
    
    SET p_mensaje = 'Disciplina eliminada correctamente';
END //

DELIMITER ;
