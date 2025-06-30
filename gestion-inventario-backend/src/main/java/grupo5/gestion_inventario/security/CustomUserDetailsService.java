package grupo5.gestion_inventario.security;

import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.EmployeeRole;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.superpanel.model.AdminUser;
import grupo5.gestion_inventario.superpanel.repository.AdminUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service("customUserDetailsService")
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1) Intentar como AdminUser del superpanel
        Optional<AdminUser> adminOpt = adminUserRepository.findByUsername(username);
        if (adminOpt.isPresent()) {
            AdminUser admin = adminOpt.get();
            List<SimpleGrantedAuthority> adminAuth = admin.getRoles().stream()
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
            return new User(admin.getUsername(), admin.getPasswordHash(), adminAuth);
        }

        // 2) Intentar como Employee (dueño y empleados)
        Optional<Employee> empOpt = employeeRepository.findByEmail(username);
        if (empOpt.isPresent()) {
            Employee emp = empOpt.get();
            List<SimpleGrantedAuthority> authorities = new ArrayList<>();
            // Rol principal: ROLE_ADMINISTRADOR, ROLE_CAJERO o ROLE_MULTIFUNCION
            String mainRole = "ROLE_" + emp.getRole().name();
            authorities.add(new SimpleGrantedAuthority(mainRole));
            // Si es ADMINISTRADOR (dueño), también le damos ROLE_CLIENT
            if (emp.getRole() == EmployeeRole.ADMINISTRADOR) {
                authorities.add(new SimpleGrantedAuthority("ROLE_CLIENT"));
            }
            return User.builder()
                    .username(emp.getEmail())
                    .password(emp.getPassword())    // <-- usamos getPassword()
                    .authorities(authorities)
                    .build();
        }

        // 3) No existe
        throw new UsernameNotFoundException("Usuario no encontrado: " + username);
    }
}

