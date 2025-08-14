// backend/src/main/java/grupo5/gestion_inventario/service/DataInitializer.java
package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.ClientCreateRequest;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.superpanel.model.AdminUser;
import grupo5.gestion_inventario.superpanel.repository.AdminUserRepository;
import grupo5.gestion_inventario.repository.ClientRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Set;

@Slf4j
@Component
public class DataInitializer implements CommandLineRunner {

    private final AdminUserRepository adminRepo;
    private final ClientRepository    clientRepo;
    private final ClientService       clientService;
    private final PasswordEncoder     passwordEncoder;

    public DataInitializer(AdminUserRepository adminRepo,
                           ClientRepository    clientRepo,
                           ClientService       clientService,
                           PasswordEncoder     passwordEncoder) {
        this.adminRepo       = adminRepo;
        this.clientRepo      = clientRepo;
        this.clientService   = clientService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {

        /* --------------------------------------------------------
         * 1) Super-admin global
         * -------------------------------------------------------- */
        adminRepo.findByUsername("admin").orElseGet(() -> {
            AdminUser admin = new AdminUser();
            admin.setUsername("admin");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRoles(Set.of("ROLE_ADMIN"));
            log.info("✅ AdminUser 'admin' creado");
            return adminRepo.save(admin);
        });

        /* --------------------------------------------------------
         * 2) Cliente demo (crea:
         *      • Client
         *      • Sucursal Principal
         *      • Empleado PROPIETARIO)
         * -------------------------------------------------------- */
        clientRepo.findByEmail("cliente1@gmail.com").orElseGet(() -> {

            ClientCreateRequest req = new ClientCreateRequest();
            req.setName("cliente1");
            req.setEmail("cliente1@gmail.com");
            req.setRawPassword("cliente1");          // ClientService cifra
            req.setTelefono("12345");
            req.setPlan("BASICO");
            req.setEstado("ACTIVO");

            Client cliente = clientService.create(req);   // ahora genera PROPIETARIO + sucursal
            cliente.setTaxPercentage(BigDecimal.ZERO);
            clientRepo.save(cliente);

            log.info("✅ Cliente de demo '{}' creado con Sucursal Principal y PROPIETARIO",
                    cliente.getEmail());
            return cliente;
        });
    }
}
