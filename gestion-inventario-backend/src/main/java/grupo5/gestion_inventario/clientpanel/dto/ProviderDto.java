package grupo5.gestion_inventario.clientpanel.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProviderDto {
    private Long id;
    private String name;
    private String contact;
    private String phone;
    private String email;
    private String address;
    private String notes;
    private Boolean active;
}
