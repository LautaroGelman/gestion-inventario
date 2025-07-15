package grupo5.gestion_inventario.security;

import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.EmployeeRole;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.superpanel.model.AdminUser;
import grupo5.gestion_inventario.superpanel.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service("customUserDetailsService")
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AdminUserRepository adminUserRepository;
    private final EmployeeRepository  employeeRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        /* 1) AdminUser del superpanel */
        Optional<AdminUser> adminOpt = adminUserRepository.findByUsername(username);
        if (adminOpt.isPresent()) {
            AdminUser admin = adminOpt.get();
            List<SimpleGrantedAuthority> adminAuth =
                    admin.getRoles().stream()
                            .map(SimpleGrantedAuthority::new)
                            .toList();

            return User.builder()
                    .username(admin.getUsername())
                    .password(admin.getPasswordHash())  // hash bcrypt
                    .authorities(adminAuth)
                    .build();
        }

        /* 2) Employee (dueño o staff) */
        Optional<Employee> empOpt = employeeRepository.findByEmail(username);
        if (empOpt.isPresent()) {
            Employee emp = empOpt.get();

            List<GrantedAuthority> authorities =
                    emp.getAuthorities().stream()
                            .map(a -> new SimpleGrantedAuthority(a.getAuthority()))
                            .collect(Collectors.toList());

            // El dueño también actúa como ROLE_CLIENT
            if (emp.getRole() == EmployeeRole.ADMINISTRADOR) {
                authorities.add(new SimpleGrantedAuthority("ROLE_CLIENT"));
            }

            return User.builder()
                    .username(emp.getEmail())
                    .password(emp.getPassword())        // usa getPassword() → hash
                    .authorities(authorities)
                    .build();
        }

        /* 3) No existe */
        throw new UsernameNotFoundException("Usuario no encontrado: " + username);
    }
}
