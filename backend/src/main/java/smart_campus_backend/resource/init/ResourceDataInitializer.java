package smart_campus_backend.resource.init;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import smart_campus_backend.resource.entity.CampusResource;
import smart_campus_backend.resource.entity.ResourceStatus;
import smart_campus_backend.resource.entity.ResourceType;
import smart_campus_backend.resource.repository.CampusResourceRepository;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ResourceDataInitializer implements CommandLineRunner {

    private final CampusResourceRepository repo;

    @Override
    public void run(String... args) {
        if (repo.count() > 0) return; // Skip if already seeded

        List<CampusResource> resources = List.of(
            CampusResource.builder()
                .name("Computing Lab 01")
                .type(ResourceType.LAB)
                .capacity(40)
                .location("Building A, Floor 2")
                .status(ResourceStatus.ACTIVE)
                .available(true)
                .imageUrl("https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800")
                .description("State-of-the-art computing lab with 40 high-performance workstations, equipped with the latest software for programming and data science.")
                .downloadUrl("https://example.com/computing-lab-01-guide.pdf")
                .build(),

            CampusResource.builder()
                .name("Main Auditorium")
                .type(ResourceType.HALL)
                .capacity(500)
                .location("Central Block, Ground Floor")
                .status(ResourceStatus.ACTIVE)
                .available(true)
                .imageUrl("https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800")
                .description("The main auditorium with full AV setup, stage lighting, and tiered seating for 500. Suitable for graduation ceremonies, guest lectures, and large events.")
                .downloadUrl("")
                .build(),

            CampusResource.builder()
                .name("3D Printing Lab")
                .type(ResourceType.LAB)
                .capacity(15)
                .location("Engineering Block, Floor 3")
                .status(ResourceStatus.ACTIVE)
                .available(true)
                .imageUrl("https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800")
                .description("Equipped with 10 FDM and 2 resin 3D printers. Used for product design prototyping and engineering projects.")
                .downloadUrl("https://example.com/3d-lab-policy.pdf")
                .build(),

            CampusResource.builder()
                .name("Seminar Hall B")
                .type(ResourceType.HALL)
                .capacity(80)
                .location("Building B, Floor 1")
                .status(ResourceStatus.ACTIVE)
                .available(true)
                .imageUrl("https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800")
                .description("A mid-size seminar hall with projector, whiteboard, and flexible seating arrangements. Ideal for workshops and department meetings.")
                .downloadUrl("")
                .build(),

            CampusResource.builder()
                .name("Portable Projector Set A")
                .type(ResourceType.EQUIPMENT)
                .capacity(1)
                .location("Equipment Store, Building C")
                .status(ResourceStatus.ACTIVE)
                .available(true)
                .imageUrl("https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=800")
                .description("Portable full-HD projector with HDMI and wireless connectivity. Comes with carrying case, remote, and screen stand.")
                .downloadUrl("")
                .build(),

            CampusResource.builder()
                .name("Networking Lab")
                .type(ResourceType.LAB)
                .capacity(30)
                .location("IT Block, Floor 1")
                .status(ResourceStatus.OUT_OF_SERVICE)
                .available(false)
                .imageUrl("https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800")
                .description("Cisco-certified networking lab with routers, switches, and fiber optic equipment. Currently under maintenance until further notice.")
                .downloadUrl("https://example.com/networking-lab-schedule.pdf")
                .build(),

            CampusResource.builder()
                .name("Media Production Studio")
                .type(ResourceType.STUDIO)
                .capacity(10)
                .location("Arts Block, Floor 2")
                .status(ResourceStatus.ACTIVE)
                .available(true)
                .imageUrl("https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800")
                .description("Professional media studio with green screen, podcast setup, video cameras, and editing workstations. Used by the media and communications faculty.")
                .downloadUrl("https://example.com/studio-booking-guide.pdf")
                .build(),

            CampusResource.builder()
                .name("Dean's Conference Room")
                .type(ResourceType.OFFICE)
                .capacity(20)
                .location("Admin Block, Floor 4")
                .status(ResourceStatus.ACTIVE)
                .available(false)
                .imageUrl("https://images.unsplash.com/photo-1497366216548-37526070297c?w=800")
                .description("Executive conference room with video conferencing system, smart TV display, and leather seating for board meetings and faculty reviews.")
                .downloadUrl("")
                .build(),

            CampusResource.builder()
                .name("VR/AR Research Lab")
                .type(ResourceType.LAB)
                .capacity(12)
                .location("Innovation Hub, Floor 2")
                .status(ResourceStatus.ACTIVE)
                .available(true)
                .imageUrl("https://images.unsplash.com/photo-1617802690658-1173a812650d?w=800")
                .description("Cutting-edge VR/AR lab equipped with Meta Quest headsets, motion capture suits, and high-end GPU workstations for immersive technology research.")
                .downloadUrl("https://example.com/vr-lab-intro.pdf")
                .build(),

            CampusResource.builder()
                .name("Video Camera Kit B")
                .type(ResourceType.EQUIPMENT)
                .capacity(1)
                .location("Equipment Store, Building C")
                .status(ResourceStatus.OUT_OF_SERVICE)
                .available(false)
                .imageUrl("https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=800")
                .description("Sony FX3 cinema camera kit with lenses, tripod, and lighting. Currently sent for sensor cleaning and calibration.")
                .downloadUrl("")
                .build(),

            CampusResource.builder()
                .name("Cyber Security Lab")
                .type(ResourceType.LAB)
                .capacity(25)
                .location("Building D, Floor 3")
                .status(ResourceStatus.ACTIVE)
                .available(true)
                .imageUrl("https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800")
                .description("Specialized lab for cyber security research, including hardware for penetration testing and incident response simulation.")
                .downloadUrl("")
                .build(),

            CampusResource.builder()
                .name("Quiet Study Zone")
                .type(ResourceType.OFFICE)
                .capacity(50)
                .location("Library, Floor 2")
                .status(ResourceStatus.ACTIVE)
                .available(true)
                .imageUrl("https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800")
                .description("A designated quiet area for individual study, equipped with comfortable seating, power outlets, and high-speed Wi-Fi.")
                .downloadUrl("")
                .build()
        );

        repo.saveAll(resources);
        log.info("✅ Seeded {} campus resources", resources.size());
    }
}
