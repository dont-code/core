package net.dontcode.core.test;

import net.dontcode.core.project.DontCodeProjectCreationType;
import net.dontcode.core.project.DontCodeProjectEntity;
import net.dontcode.core.project.DontCodeProjectModel;
import net.dontcode.core.project.DontCodeProjectWorkflow;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collection;
import java.util.Map;

public class JsonMappingTest {

    @Test
    public void testJsonSimpleSupport () throws IOException, URISyntaxException {
        URL url = Thread.currentThread().getContextClassLoader().getResource("projects/simple-project.json");
        String jsonProject= Files.readString(Path.of (url.toURI()));

        DontCodeProjectModel read=Utils.fromJsonToObject(jsonProject, DontCodeProjectModel.class);
        Assertions.assertNotNull (read);
        Assertions.assertNotNull(read.content().creation().name());
        Assertions.assertEquals(DontCodeProjectCreationType.application, read.content().creation().type());
        DontCodeProjectEntity[] entities = read.content().creation().entities();
        Assertions.assertEquals(1, entities.length);
        Assertions.assertEquals(2, entities[0].fields().length);

    }

    @Test
    public void testJsonWorkflowSupport () throws IOException, URISyntaxException {
        URL url = Thread.currentThread().getContextClassLoader().getResource("projects/workflow-project.json");
        String jsonProject= Files.readString(Path.of (url.toURI()));

        DontCodeProjectModel read=Utils.fromJsonToObject(jsonProject, DontCodeProjectModel.class);
        Assertions.assertNotNull (read);
        Assertions.assertNotNull(read.content().creation().name());
        Assertions.assertEquals(DontCodeProjectCreationType.application, read.content().creation().type());
        Collection<DontCodeProjectWorkflow> workflows = read.content().creation().workflows().values();
        Assertions.assertEquals(2, workflows.size());
        Assertions.assertEquals("Test1",workflows.iterator().next().entity() );



    }

}
