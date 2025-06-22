package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.superpanel.model.AdminUser;
import grupo5.gestion_inventario.superpanel.repository.AdminUserRepository;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.EmployeeRole;
import grupo5.gestion_inventario.repository.ClientRepository;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Crear admin global si no existe
        if (adminUserRepository.findByUsername("admin").isEmpty()) {
            AdminUser admin = new AdminUser();
            admin.setUsername("admin");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRoles(Set.of("ROLE_ADMIN"));
            adminUserRepository.save(admin);
        }

        // Crear cliente de prueba si no existe
        if (clientRepository.findByEmail("cliente1@gmail.com").isEmpty()) {
            Client cliente = new Client();
            cliente.setName("cliente1");
            cliente.setEmail("cliente1@gmail.com");
            cliente.setPasswordHash(passwordEncoder.encode("cliente1"));
            cliente.setTelefono("12345");
            cliente.setPlan("BASICO");
            cliente.setEstado("ACTIVO");
            cliente.setTaxPercentage(BigDecimal.ZERO);
            clientRepository.save(cliente);

            // Crear empleado ADMINISTRADOR para el dueño del negocio
            Employee ownerEmp = new Employee();
            ownerEmp.setClient(cliente);
            ownerEmp.setEmail(cliente.getEmail());
            ownerEmp.setName(cliente.getName());
            ownerEmp.setPasswordHash(cliente.getPasswordHash());
            ownerEmp.setRole(EmployeeRole.ADMINISTRADOR);
            employeeRepository.save(ownerEmp);
        }
    }
}
