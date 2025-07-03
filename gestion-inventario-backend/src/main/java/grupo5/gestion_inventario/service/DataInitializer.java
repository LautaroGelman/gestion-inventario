// src/main/java/grupo5/gestion_inventario/service/DataInitializer.java
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

    private final AdminUserRepository adminUserRepository;
    private final ClientRepository    clientRepository;
    private final ClientService       clientService;
    private final PasswordEncoder     passwordEncoder;

    public DataInitializer(AdminUserRepository adminUserRepository,
                           ClientRepository clientRepository,
                           ClientService clientService,
                           PasswordEncoder passwordEncoder) {
        this.adminUserRepository = adminUserRepository;
        this.clientRepository    = clientRepository;
        this.clientService       = clientService;
        this.passwordEncoder     = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {

        /* 1) AdminUser global del superpanel */
        adminUserRepository.findByUsername("admin").orElseGet(() -> {
            AdminUser admin = new AdminUser();
            admin.setUsername("admin");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRoles(Set.of("ROLE_ADMIN"));
            log.info("✅ AdminUser 'admin' creado");
            return adminUserRepository.save(admin);
        });

        /* 2) Cliente demo + dueño administrador */
        if (clientRepository.findByEmail("cliente1@gmail.com").isEmpty()) {

            ClientCreateRequest req = new ClientCreateRequest();
            req.setName("cliente1");
            req.setEmail("cliente1@gmail.com");
            req.setRawPassword("cliente1");   // ClientService cifrará
            req.setTelefono("12345");
            req.setPlan("BASICO");
            req.setEstado("ACTIVO");

            Client cliente = clientService.create(req);           // crea Client + Employee
            cliente.setTaxPercentage(BigDecimal.ZERO);            // ajuste extra
            clientRepository.save(cliente);

            log.info("✅ Cliente '{}' y su empleado administrador creados", cliente.getEmail());
        } else {
            log.info("ℹ️  Cliente de prueba ya existe, no se recrea");
        }
    }
}
