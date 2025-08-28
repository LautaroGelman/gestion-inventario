package grupo5.gestion_inventario.clientpanel.dto;

import lombok.Data;

@Data
public class ProviderCreateRequest {
    private String name;     // nombre comercial
    private String contact;  // persona de contacto
    private String phone;    // teléfono
    private String email;    // email
    private String address;  // dirección
    private String notes;    // notas
}
