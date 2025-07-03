// src/main/java/grupo5/gestion_inventario/clientpanel/dto/ClientCreateRequest.java
package grupo5.gestion_inventario.clientpanel.dto;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/** Datos que llegan por POST /api/clients */
@Setter
@Getter
public class ClientCreateRequest {

    /* getters & setters */
    @NotBlank
    private String name;

    @Email
    @NotBlank
    private String email;

    /** Contraseña en texto plano */
    @NotBlank
    private String rawPassword;

    private String telefono;
    private String plan;
    private String estado = "ACTIVO";

    public ClientCreateRequest() {}

}
