// src/main/java/grupo5/gestion_inventario/clientpanel/dto/UpdateEmployeeRequest.java
package grupo5.gestion_inventario.clientpanel.dto;

import grupo5.gestion_inventario.model.EmployeeRole;
import lombok.Getter;
import lombok.Setter;

/**
 * Datos que se pueden actualizar de un empleado.
 * Envía sólo los campos que quieras modificar.
 */
@Getter
@Setter
public class UpdateEmployeeRequest {

    /** Nuevo nombre (opcional). */
    private String name;

    /** Nueva contraseña en texto plano (opcional). */
    private String passwordHash;

    /** Nuevo rol (opcional). */
    private EmployeeRole role;


}
