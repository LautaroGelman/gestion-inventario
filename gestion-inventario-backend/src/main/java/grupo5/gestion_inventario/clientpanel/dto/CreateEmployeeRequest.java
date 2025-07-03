// src/main/java/grupo5/gestion_inventario/clientpanel/dto/CreateEmployeeRequest.java
package grupo5.gestion_inventario.clientpanel.dto;

import grupo5.gestion_inventario.model.EmployeeRole;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class CreateEmployeeRequest {
    private String name;
    private String email;
    private String password;
    private EmployeeRole role;

}

